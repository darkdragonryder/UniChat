export default async function desetupCommand(message, supabase) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  // Get settings
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .single();

  if (!data) {
    return message.reply("⚠️ No setup found");
  }

  const languageChannels = data.language_channels || {};
  const languages = data.languages || [];

  // ===== DELETE CHANNELS =====
  for (const lang of Object.keys(languageChannels)) {
    const channelId = languageChannels[lang];
    const channel = guild.channels.cache.get(channelId);

    if (channel) {
      await channel.delete().catch(() => {});
    }
  }

  // ===== DELETE ROLES =====
  for (const lang of languages) {
    const role = guild.roles.cache.find(r => r.name === lang);

    if (role) {
      await role.delete().catch(() => {});
    }
  }

  // ===== REMOVE FROM DATABASE =====
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  message.reply("🗑️ UniChat removed and cleaned up.");
}
