import { EmbedBuilder } from "discord.js";
import { supabase } from "../services/supabase.js";

export default async function infoCommand(interaction, client) {
  try {

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

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
    const status =
      client.ws.ping < 200
        ? "🟢 Online & Operational"
        : "🟡 Degraded Performance";

    // ================= EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌏 UniChat System Info")
      .addFields(
        {
          name: "📦 Version",
          value: "4.0",
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
          value: status,
          inline: false
        }
      )
      .setFooter({
        text: "UniChat • Enterprise Mode"
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.log("INFO ERROR:", err.message);

    return interaction.editReply({
      content: "❌ Failed to load system info."
    });
  }
}
