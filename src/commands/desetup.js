export default async function desetupCommand(message, supabase) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!data) return message.reply("⚠️ Nothing to remove");

  const channels = data.enabled_channels || {};

  // DELETE CHANNELS
  for (const id of Object.values(channels)) {
    const ch = message.guild.channels.cache.get(id);
    if (ch) await ch.delete().catch(() => {});
  }

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", message.guild.id);

  message.reply("🗑️ Cleaned up successfully");
}
