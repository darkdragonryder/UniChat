import { supabase } from "../services/supabase.js";

const roles = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {
  await interaction.reply({
    content: "🧹 Fully removing UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  // ================= GET DATA =================
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  // ================= FORCE FETCH ALL CHANNELS =================
  const channels = await guild.channels.fetch();

  // ================= DELETE LANGUAGE CHANNELS =================
  if (data?.enabled_channels) {
    for (const channelId of Object.values(data.enabled_channels)) {
      const channel = channels.get(channelId);

      if (channel) {
        await channel.delete().catch(err => {
          console.log("DELETE FAIL (tracked):", err.message);
        });
      }
    }
  }

  // ================= DELETE BY CATEGORY (CRITICAL BACKUP) =================
  const category = channels.find(c => c.name === "🌍 UniChat");

  if (category) {
    const children = channels.filter(c => c.parentId === category.id);

    for (const channel of children.values()) {
      await channel.delete().catch(err => {
        console.log("DELETE FAIL (category child):", err.message);
      });
    }

    await category.delete().catch(err => {
      console.log("CATEGORY DELETE FAIL:", err.message);
    });
  }

  // ================= DELETE ROLES =================
  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);

    if (role) {
      await role.delete().catch(err => {
        console.log("ROLE DELETE FAIL:", err.message);
      });
    }
  }

  // ================= CLEAR DATABASE =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed (channels + roles + DB).",
    ephemeral: true
  });
}
