import { EmbedBuilder } from "discord.js";
import { supabase } from "../services/supabase.js";
import pkg from "../package.json" assert { type: "json" };

export default async function infoCommand(interaction, client) {
  try {

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    const { data } = await supabase
      .from("guild_settings")
      .select("enabled_channels, base_channel_id")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const channels = data?.enabled_channels || {};
    const baseChannelId = data?.base_channel_id;

    const totalLanguages = Object.keys(channels).length;
    const baseChannel = baseChannelId
      ? await guild.channels.fetch(baseChannelId).catch(() => null)
      : null;

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌏 UniChat v4 Dashboard")
      .setDescription("Global communication system is active.")
      .addFields(
        {
          name: "📦 Version",
          value: `v${pkg.version}`,
          inline: true
        },
        {
          name: "🏠 Server",
          value: guild.name,
          inline: true
        },
        {
          name: "🌐 Languages Active",
          value: `${totalLanguages}`,
          inline: true
        },
        {
          name: "💬 Base Channel",
          value: baseChannel
            ? `<#${baseChannel.id}>`
            : "Not configured",
          inline: false
        },
        {
          name: "⚙️ Status",
          value: "🟢 Online & Operational",
          inline: false
        }
      )
      .setFooter({
        text: "UniChat • Real-time translation system"
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.log("INFO ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: "❌ Failed to load info.",
        ephemeral: true
      });
    }
  }
}
