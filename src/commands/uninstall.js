import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Removing UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;
  const channels = await guild.channels.fetch();

  const category = channels.find(c => c.name === "🌍 UniChat");

  if (category) {
    for (const ch of channels.values()) {
      if (ch.parentId === category.id) {
        await ch.delete().catch(() => {});
      }
    }
    await category.delete().catch(() => {});
  }

  for (const ch of channels.values()) {
    if (ch.name?.startsWith("general-")) {
      await ch.delete().catch(() => {});
    }
  }

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed",
    ephemeral: true
  });
}
