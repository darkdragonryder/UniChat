import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {

  await interaction.reply({
    content: "🧹 Removing UniChat...",
    ephemeral: true
  });

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", interaction.guild.id)
    .single();

  if (data) {
    const channels = data.enabled_channels || {};

    for (const id of Object.values(channels)) {
      const ch = interaction.guild.channels.cache.get(id);
      if (ch) await ch.delete().catch(() => {});
    }
  }

  // delete UniChat category
  const category = interaction.guild.channels.cache.find(
    c => c.name === "UniChat"
  );

  if (category) await category.delete().catch(() => {});

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", interaction.guild.id);

  await interaction.followUp({
    content: "✅ UniChat removed",
    ephemeral: true,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Dismiss",
            style: 4,
            custom_id: "dismiss"
          }
        ]
      }
    ]
  });
}
