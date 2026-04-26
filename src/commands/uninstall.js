import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("🧹 Uninstalling UniChat...");

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  if (!data) {
    return interaction.editReply("⚠️ No setup found");
  }

  const { enabled_channels } = data;

  // ================= DELETE CHANNELS =================
  for (const id of Object.values(enabled_channels || {})) {
    const channel = guild.channels.cache.get(id);
    if (channel) await channel.delete().catch(() => {});
  }

  // ================= DELETE CATEGORY =================
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === 4
  );

  if (category) {
    await category.delete().catch(() => {});
  }

  // ================= DELETE ROLES =================
  const roleNames = ["Spanish", "German", "Italian", "Korean", "Russian", "Japanese"];

  for (const name of roleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= CLEAR DB =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ UniChat uninstalled cleanly");
}
