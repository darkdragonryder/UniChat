const LANGUAGES = {
  es: "Spanish",
  de: "German",
  it: "Italian",
  ko: "Korean"
};

export default async function setupCommand(message, supabase) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  await message.reply("📌 Mention the DEFAULT (English) channel.");

  const collected = await message.channel.awaitMessages({
    filter: m => m.author.id === message.author.id,
    max: 1,
    time: 60000
  });

  const defaultChannel = collected.first()?.mentions.channels.first();
  if (!defaultChannel) return message.reply("❌ No channel selected");

  const enabledChannels = {};

  // CREATE LANGUAGE CHANNELS
  for (const lang of Object.keys(LANGUAGES)) {
    const channel = await guild.channels.create({
      name: `${defaultChannel.name}-${lang}`,
      type: 0
    });

    enabledChannels[lang] = channel.id;
  }

  // SAVE TO SUPABASE
  const { error } = await supabase.from("guild_settings").upsert({
    guild_id: guild.id,
    default_channel: defaultChannel.id,
    enabled_channels: enabledChannels
  });

  if (error) {
    console.log(error);
    return message.reply("❌ Failed setup: " + error.message);
  }

  message.reply("✅ Setup complete!");
}
