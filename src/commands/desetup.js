export default async function desetupCommand(message, supabase) {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Admin only");
  }

  const guild = message.guild;

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .single();

  if (!data) return message.reply("⚠️ Nothing to remove");

  const channels = data.enabled_channels || {};

  // ===== DELETE CHANNELS (SAFE FETCH) =====
  for (const id of Object.values(channels)) {
    try {
      const channel = await guild.channels.fetch(id).catch(() => null);
      if (channel) await channel.delete("UniChat cleanup");
    } catch (err) {
      console.log("Channel delete failed:", err.message);
    }
  }

  // ===== DELETE ROLES (if they exist) =====
  for (const lang of Object.keys(channels)) {
    try {
      const role = guild.roles.cache.find(r => r.name.toLowerCase() === lang);

      if (role) {
        await role.delete("UniChat cleanup");
      }
    } catch (err) {
      console.log("Role delete failed:", err.message);
    }
  }

  // ===== REMOVE DB ENTRY =====
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  message.reply("🗑️ Cleanup completed (channels + roles removed)");
}
