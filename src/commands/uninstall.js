import { supabase } from "../services/supabase.js";

const roles = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Uninstalling UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const channels = await guild.channels.fetch();

  // ================= DELETE CHANNELS =================
  if (data?.enabled_channels) {
    for (const id of Object.values(data.enabled_channels)) {
      const ch = channels.get(id);
      if (ch) await ch.delete().catch(() => {});
    }
  }

  // ================= CATEGORY CLEANUP =================
  const category = channels.find(c => c.name === "🌍 UniChat");

  if (category) {
    const children = channels.filter(c => c.parentId === category.id);

    for (const ch of children.values()) {
      await ch.delete().catch(() => {});
    }

    await category.delete().catch(() => {});
  }

  // ================= ROLES =================
  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= DB CLEAN =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ Fully removed UniChat",
    ephemeral: true
  });
}
