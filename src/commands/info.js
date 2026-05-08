import { EmbedBuilder } from "discord.js";
import { db } from "../services/supabase.js";

export default async function infoCommand(interaction, client) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const supabase = db();

    const { data, error } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ Database error");
    }

    const enabled = data?.enabled_channels || {};

    // ================= BASE CHANNEL =================
    const baseChannel =
      data?.default_channel ||
      data?.active_channel ||
      null;

    const baseChannelObj = baseChannel
      ? guild.channels.cache.get(baseChannel)
      : null;

    // ================= LANGUAGE COUNT =================
    const languageCount = Object.keys(enabled).length;

    // ================= STATUS =================
    const ping = client.ws.ping;
    const status = ping < 200
      ? "🟢 Online & Operational"
      : ping < 500
        ? "🟡 Degraded Performance"
        : "🔴 High Latency";

    // ================= EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌏 UniChat System Info")
      .addFields(
        {
          name: "📦 Version",
          value: "4.2",
          inline: true
        },
        {
          name: "🏠 Server",
          value: guild.name,
          inline: true
        },
        {
          name: "🌍 Active Languages",
          value: String(languageCount),
          inline: true
        },
        {
          name: "📍 Base Channel",
          value: baseChannelObj
            ? `#${baseChannelObj.name}`
            : "❌ Not configured",
          inline: false
        },
        {
          name: "📡 Status",
          value: `${status} (${ping}ms)`,
          inline: false
        }
      )
      .setFooter({
        text: "UniChat • Enterprise Mode"
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.log("INFO ERROR:", err);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply("❌ Failed to load system info.");
    }

    return interaction.reply({
      content: "❌ Failed to load system info.",
      ephemeral: true
    });
  }
}
