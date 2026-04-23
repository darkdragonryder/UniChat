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
    .single();

  if (data?.enabled_channels) {
    for (const id of Object.values(data.enabled_channels)) {
      const ch = guild.channels.cache.get(id);
      if (ch) await ch.delete().catch(() => {});
    }
  }

  const category = guild.channels.cache.find(c => c.name === "🌍 UniChat");
  if (category) await category.delete().catch(() => {});

  for (const name of roles) {
    const r = guild.roles.cache.find(x => x.name === name);
    if (r) await r.delete().catch(() => {});
  }

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat removed completely.",
    ephemeral: true
  });
}
