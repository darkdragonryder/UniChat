import { supabase } from "../services/supabase.js";

const roleNames = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {
  await interaction.reply({
    content: "🧹 Uninstalling UniChat system...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .single();

  // ================= DELETE CHANNELS =================
  if (data?.enabled_channels) {
    for (const channelId of Object.values(data.enabled_channels)) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        await channel.delete().catch(() => {});
      }
    }
  }

  // ================= DELETE CATEGORY =================
  const category = guild.channels.cache.find(c => c.name === "🌍 UniChat");
  if (category) {
    await category.delete().catch(() => {});
  }

  // ================= DELETE ROLES =================
  for (const roleName of roleNames) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      await role.delete().catch(() => {});
    }
  }

  // ================= CLEAR DB =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed from this server.",
    ephemeral: true
  });
}
