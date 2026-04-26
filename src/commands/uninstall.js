import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  // ================= FORCE FETCH =================
  await guild.channels.fetch();
  await guild.roles.fetch(); // 🔥 THIS WAS MISSING

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const enabled = data?.enabled_channels || {};

  // ================= 1. DELETE CHANNELS =================
  for (const id of Object.values(enabled)) {
    const ch = guild.channels.cache.get(id);
    if (ch) await ch.delete().catch(() => {});
  }

  // ================= 2. DELETE CATEGORY + ORPHANS =================
  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat" && c.type === 4
  );

  if (category) {
    const children = guild.channels.cache.filter(c => c.parentId === category.id);

    for (const ch of children.values()) {
      await ch.delete().catch(() => {});
    }

    await category.delete().catch(() => {});
  }

  // ================= 3. DELETE ROLES =================
  const roles = ["Spanish", "German", "Italian", "Korean", "Russian", "Japanese"];

  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);

    if (!role) {
      console.log(`⚠️ Role not found: ${name}`);
      continue;
    }

    try {
      await role.delete();
      console.log(`🗑️ Deleted role: ${name}`);
    } catch (err) {
      console.log(`❌ Failed to delete ${name}:`, err.message);
    }
  }

  // ================= 4. DELETE DATABASE =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ Uninstall complete");
}
