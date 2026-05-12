import { db } from "./supabase.js";

const queue = [];
let active = 0;

const MAX_CONCURRENT = 2;
const INTERVAL = 300;

export function enqueue(job) {
  queue.push(job);
}

async function processJob(job) {
  const supabase = db();

  const { message, channels, sourceLang, translateCached } = job;

  if (!message?.guild || !message.content) return;

  const channelMap = { [sourceLang]: message.id };

  const tasks = [];

  for (const [lang, id] of Object.entries(channels || {})) {
    if (lang === sourceLang) continue;

    const channel = message.guild.channels.cache.get(id);
    if (!channel) continue;

    tasks.push((async () => {
      try {
        const translated = await translateCached(message.content, lang);
        if (!translated) return;

        const sent = await channel.send({ content: translated }).catch(() => null);
        if (sent) channelMap[lang] = sent.id;

      } catch (err) {
        console.log(`QUEUE TRANSLATE ERROR [${lang}]:`, err.message);
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
  }).catch(err => {
    console.log("QUEUE UPSERT ERROR:", err.message);
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

  active = Math.max(0, active - 1);
}, INTERVAL);
