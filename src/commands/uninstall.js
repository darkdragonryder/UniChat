import { supabase } from "../services/supabase.js";

const roles = ["English", "Spanish", "German", "Italian", "Korean", "Russian"];

export default async function uninstallCommand(interaction) {
  await interaction.reply({
    content: "🧹 Fully uninstalling UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  // ================= FETCH DATA =================
  const { data } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", guild.id)
    .maybeSingle();

  // ================= STEP 1: DELETE DB-TRACKED CHANNELS =================
  if (data?.enabled_channels) {
    for (const channelId of Object.values(data.enabled_channels)) {
      try {
        const channel = await guild.channels.fetch(channelId);
        if (channel) await channel.delete();
      } catch (err) {
        console.log("Tracked channel delete failed:", err.message);
      }
    }
  }

  // ================= STEP 2: FORCE DELETE CATEGORY + CHILDREN =================
  const category = guild.channels.cache.find(c => c.name === "🌍 UniChat");

  if (category) {
    try {
      const children = await guild.channels.fetch();

      const toDelete = children.filter(
        c => c.parentId === category.id
      );

      for (const channel of toDelete.values()) {
        await channel.delete().catch(err => {
          console.log("Child delete failed:", err.message);
        });
      }

      await category.delete();
    } catch (err) {
      console.log("Category cleanup failed:", err.message);
    }
  }

  // ================= STEP 3: DELETE ROLES =================
  for (const name of roles) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) {
      await role.delete().catch(err => {
        console.log("Role delete failed:", err.message);
      });
    }
  }

  // ================= STEP 4: CLEAR DATABASE =================
  await supabase
    .from("guild_settings")
    .delete()
    .eq("guild_id", guild.id);

  return interaction.followUp({
    content: "✅ UniChat fully removed (channels, roles, database).",
    ephemeral: true
  });
}
