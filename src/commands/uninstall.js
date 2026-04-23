import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {

  await interaction.reply({ content: "🧹 Uninstalling...", ephemeral: true });

  const guild = interaction.guild;
  const channels = await guild.channels.fetch();

  // ===== DELETE LANGUAGE CHANNELS =====
  for (const ch of channels.values()) {
    if (ch.name && ch.name.startsWith("general-")) {
      await ch.delete().catch(() => {});
    }
  }

  // ===== DELETE CATEGORY =====
  const category = channels.find(c => c.name === "🌍 UniChat");
  if (category) {
    await category.delete().catch(() => {});
  }

  // ===== DELETE ROLES =====
  const roles = [
    "English",
    "Spanish",
    "German",
    "Italian",
    "Korean",
    "Russian",
    "Japanese"
  ];

  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  // ===== CLEAN DB =====
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  await interaction.followUp({
    content: "✅ Fully removed (channels included)",
    ephemeral: true
  });
}
