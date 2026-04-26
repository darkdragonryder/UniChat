import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("🧹 Uninstalling UniChat...");

  await guild.channels.fetch();

  // ================= GET SETTINGS =================
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const enabled = data?.enabled_channels || {};

  // ================= 1. DELETE CHANNELS FIRST (IMPORTANT) =================
  for (const id of Object.values(enabled)) {
    const channel = guild.channels.cache.get(id);
    if (channel) {
      await channel.delete().catch(() => {});
    }
  }

  // ALSO CATCH ANY ORPHANS IN CATEGORY
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === 4
  );

  if (category) {
    const children = guild.channels.cache.filter(
      c => c.parentId === category.id
    );

    for (const ch of children.values()) {
      await ch.delete().catch(() => {});
    }
  }

  // ================= 2. DELETE CATEGORY SECOND =================
  if (category) {
    await category.delete().catch(() => {});
  }

  // ================= 3. DELETE ROLES THIRD =================
  const roles = ["Spanish", "German", "Italian", "Korean", "Russian", "Japanese"];

  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) {
      await role.delete().catch(() => {});
    }
  }

  // ================= 4. DELETE DATABASE LAST =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ UniChat fully uninstalled");
}
