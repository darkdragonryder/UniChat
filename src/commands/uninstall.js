import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  await guild.channels.fetch();

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  const enabled = data?.enabled_channels || {};

  for (const id of Object.values(enabled)) {
    const ch = guild.channels.cache.get(id);
    if (ch) await ch.delete().catch(() => {});
  }

  const category = guild.channels.cache.find(
    c => c.name === "🌍 UniChat"
  );

  if (category) {
    for (const ch of category.children.cache.values()) {
      await ch.delete().catch(() => {});
    }
    await category.delete().catch(() => {});
  }

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ Uninstall complete");
}
