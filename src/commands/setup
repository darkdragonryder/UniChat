export default async function setupCommand(message, supabase) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  // Languages (you can expand later)
  const languages = ["EN", "ES", "FR"];

  const createdChannels = {};

  for (const lang of languages) {
    // ===== ROLE =====
    let role = guild.roles.cache.find(r => r.name === lang);

    if (!role) {
      role = await guild.roles.create({
        name: lang,
        reason: "Language role"
      });
    }

    // ===== CHANNEL =====
    let channel = guild.channels.cache.find(
      c => c.name === `chat-${lang.toLowerCase()}`
    );

    if (!channel) {
      channel = await guild.channels.create({
        name: `chat-${lang.toLowerCase()}`,
        type: 0
      });
    }

    createdChannels[lang] = channel.id;
  }

  // ===== SAVE TO DATABASE =====
  const { error } = await supabase
    .from("guild_settings")
    .upsert({
      guild_id: guild.id,
      auto_translate: true,
      default_language: "EN",
      enabled_channels: [],
      language_channels: createdChannels,
      languages
    });

  if (error) {
    console.error(error);
    return message.reply("❌ Failed to save setup");
  }

  message.reply("✅ Setup complete!");
}
