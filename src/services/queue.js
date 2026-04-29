const queue = [];
let active = 0;

const MAX_CONCURRENT = 3;
const INTERVAL = 250;

export function enqueue(job) {
  queue.push(job);
}

async function processJob(job) {
  const { message, channels, sourceLang, translateCached, supabase } = job;

  const guildChannels = message.guild.channels.cache;
  const channelMap = { [sourceLang]: message.id };

  const tasks = [];

  for (const [lang, id] of Object.entries(channels)) {
    if (lang === sourceLang) continue;

    const channel = guildChannels.get(id);
    if (!channel) continue;

    tasks.push((async () => {
      const translated = await translateCached(message.content, lang);
      if (!translated) return;

      const sent = await channel.send({ content: translated }).catch(() => null);

      if (sent) {
        channelMap[lang] = sent.id;
      }
    })());
  }

  await Promise.all(tasks);

  await supabase.from("message_maps").upsert({
    guild_id: message.guild.id,
    base_message_id: message.id,
    channel_map: channelMap
  }, {
    onConflict: "guild_id,base_message_id"
  });
}

setInterval(async () => {
  if (active >= MAX_CONCURRENT) return;
  if (queue.length === 0) return;

  const job = queue.shift();
  if (!job) return;

  active++;

  try {
    await processJob(job);
  } catch (err) {
    console.log("QUEUE ERROR:", err.message);
  }

  active--;
}, INTERVAL);
