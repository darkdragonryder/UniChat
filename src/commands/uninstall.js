import { supabase } from "../services/supabase.js";

export default async function uninstallCommand(interaction) {
  try {

    // 💥 CRITICAL FIX: prevents "application not responding"
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;

    // ================= FETCH DATA =================
    const { data, error } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guildId)
      .maybeSingle();

    if (error) {
      return interaction.editReply("❌ DB error while uninstalling.");
    }

    if (!data) {
      return interaction.editReply("⚠️ No UniChat setup found for this server.");
    }

    // ================= DELETE CHANNELS (SAFE LOOP) =================
    const channels = data.enabled_channels || {};

    for (const id of Object.values(channels)) {
      const ch = await interaction.guild.channels.fetch(id).catch(() => null);
      if (ch) {
        await ch.delete("UniChat uninstall").catch(() => {});
      }
    }

    // ================= DELETE CATEGORY SAFELY =================
    const category = interaction.guild.channels.cache.find(
      c => c.name === "🌍 UniChat"
    );

    if (category) {
      await category.delete("UniChat uninstall").catch(() => {});
    }

    // ================= REMOVE ROLES =================
    const roles = interaction.guild.roles.cache.filter(r =>
      r.name.includes("UniChat") || r.name.includes("Spanish") ||
      r.name.includes("German") || r.name.includes("Italian") ||
      r.name.includes("Korean") || r.name.includes("Japanese")
    );

    for (const role of roles.values()) {
      await role.delete("UniChat uninstall").catch(() => {});
    }

    // ================= DELETE DB ROW =================
    await supabase
      .from("guild_settings")
      .delete()
      .eq("guild_id", guildId);

    return interaction.editReply("✅ UniChat successfully uninstalled.");

  } catch (err) {
    console.log("UNINSTALL ERROR:", err.message);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Uninstall failed.",
        ephemeral: true
      });
    }
  }
}
