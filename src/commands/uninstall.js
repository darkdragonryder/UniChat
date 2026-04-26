import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  const guild = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("🧹 Uninstalling UniChat...");

  await guild.channels.fetch();

  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  if (data?.enabled_channels) {
    for (const id of Object.values(data.enabled_channels)) {
      const channel = guild.channels.cache.get(id);
      if (channel) await channel.delete().catch(() => {});
    }
  }

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

    await category.delete().catch(() => {});
  }

  const roles = ["Spanish", "German", "Italian", "Korean", "Russian", "Japanese"];

  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.editReply("✅ UniChat fully uninstalled");
}
