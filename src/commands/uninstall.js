import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("🧹 Uninstalling UniChat...");

  // ================= GET DB DATA =================
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  // ================= SAFETY FETCH (IMPORTANT FIX) =================
  await guild.channels.fetch();

  // ================= DELETE BY DB IDS =================
  if (data?.enabled_channels) {
    for (const id of Object.values(data.enabled_channels)) {
      const channel = guild.channels.cache.get(id);
      if (channel) {
        await channel.delete().catch(() => {});
      }
    }
  }

  // ================= FALLBACK: DELETE BY CATEGORY =================
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === 4
  );

  if (category) {
    const children = guild.channels.cache.filter(
      c => c.parentId === category.id
    );

    for (const channel of children.values()) {
      await channel.delete().catch(() => {});
    }

    await category.delete().catch(() => {});
  }

  // ================= DELETE ROLES =================
  const roleNames = ["Spanish", "German", "Italian", "Korean", "Russian", "Japanese"];

  for (const name of roleNames) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= CLEAR DATABASE =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ UniChat fully uninstalled");
}
