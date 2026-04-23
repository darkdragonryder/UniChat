import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Uninstalling UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;
  const channels = await guild.channels.fetch();

  // ================= DELETE CATEGORY + CHILDREN =================
  for (const ch of channels.values()) {
    if (ch.name?.startsWith("general-") || ch.name === "general") continue;

    if (ch.parent?.name === "🌍 UniChat") {
      await ch.delete().catch(() => {});
    }
  }

  const category = channels.find(c => c.name === "🌍 UniChat");

  if (category) {
    for (const ch of channels.values()) {
      if (ch.parentId === category.id) {
        await ch.delete().catch(() => {});
      }
    }
    await category.delete().catch(() => {});
  }

  // ================= DELETE ROLES =================
  const roleNames = [
    "English",
    "Spanish",
    "German",
    "Italian",
    "Korean",
    "Russian",
    "Japanese"
  ];

  for (const roleName of roleNames) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) await role.delete().catch(() => {});
  }

  // ================= CLEAR DB =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  await supabase
    .from("user_settings")
    .delete()
    .in("user_id", (await guild.members.fetch()).map(m => m.id))
    .catch(() => {});

  return interaction.followUp({
    content: "✅ Fully removed (channels, roles, DB)",
    ephemeral: true
  });
}
