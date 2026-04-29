import { EmbedBuilder } from "discord.js";
import { supabase } from "../services/supabase.js";

export default async function diagnoseCommand(interaction, client) {
  try {

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    // ================= DB LOAD =================
    const { data, error } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const enabled = data?.enabled_channels || {};

    // ================= BASE CHANNEL =================
    const baseId =
      data?.default_channel ||
      data?.active_channel ||
      null;

    const baseChannel = baseId
      ? guild.channels.cache.get(baseId)
      : null;

    // ================= ROLE CHECK =================
    const roleNames = [
      "English",
      "Spanish",
      "German",
      "Italian",
      "Korean",
      "Russian",
      "Japanese"
    ];

    const missingRoles = roleNames.filter(
      r => !guild.roles.cache.some(role => role.name === r)
    );

    // ================= CHANNEL CHECK =================
    const missingChannels = [];

    for (const [lang, id] of Object.entries(enabled)) {
      const exists = guild.channels.cache.get(id);
      if (!exists) {
        missingChannels.push(`${lang}: missing`);
      }
    }

    // ================= HEALTH STATUS =================
    const dbStatus = error ? "❌ DB ERROR" : "🟢 OK";

    const channelStatus =
      Object.keys(enabled).length > 0
        ? "🟢 OK"
        : "❌ No channels configured";

    const roleStatus =
      missingRoles.length > 0
        ? `⚠️ Missing (${missingRoles.length})`
        : "🟢 OK";

    const baseStatus =
      baseChannel ? "🟢 OK" : "❌ Not configured";

    const ping = client.ws.ping;

    const status =
      ping < 200 ? "🟢 Healthy" :
      ping < 500 ? "🟡 Slow" :
      "🔴 Poor";

    // ================= EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("🧪 UniChat Diagnose Report")
      .addFields(
        {
          name: "📊 Bot Status",
          value: `${status} (${ping}ms)`,
          inline: false
        },
        {
          name: "🗄️ Database",
          value: dbStatus,
          inline: true
        },
        {
          name: "🌍 Channels Config",
          value: channelStatus,
          inline: true
        },
        {
          name: "🏠 Base Channel",
          value: baseStatus,
          inline: true
        },
        {
          name: "👥 Roles",
          value: roleStatus,
          inline: false
        }
      )
      .setFooter({
        text: "UniChat • Diagnose System"
      })
      .setTimestamp();

    // Add warnings if needed
    if (missingRoles.length > 0 || missingChannels.length > 0) {
      embed.addFields({
        name: "⚠️ Issues Found",
        value:
          [
            ...missingRoles.map(r => `Missing role: ${r}`),
            ...missingChannels
          ].join("\n") || "None"
      });
    }

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.log("DIAGNOSE ERROR:", err.message);

    return interaction.editReply({
      content: "❌ Diagnose failed"
    });
  }
}
