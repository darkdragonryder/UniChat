import { supabase } from "../services/supabase.js";

const roles = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {
  await interaction.reply({
    content: "🧹 Uninstalling UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  // ================= SAFE FETCH =================
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  // ================= DELETE CHANNELS (SAFE MODE) =================

  // 1. delete tracked channels from DB
  if (data?.enabled_channels) {
    for (const channelId of Object.values(data.enabled_channels)) {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (channel) {
        await channel.delete().catch(() => {});
      }
    }
  }

  // 2. fallback: delete ALL channels under UniChat category (CRITICAL FIX)
  const category = guild.channels.cache.find(c => c.name === "🌍 UniChat");

  if (category) {
    const children = guild.channels.cache.filter(
      c => c.parentId === category.id
    );

    for (const channel of children.values()) {
      await channel.delete().catch(() => {});
    }

    await category.delete().catch(() => {});
  }

  // ================= DELETE ROLES =================
  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) await role.delete().catch(() => {});
  }

  // ================= CLEAN DB =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed (channels + roles + data).",
    ephemeral: true
  });
}
