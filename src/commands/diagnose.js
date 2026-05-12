import { EmbedBuilder } from "discord.js";
import { db } from "../services/supabase.js";
import { autoHeal } from "../services/autoHeal.js";

export default async function diagnoseCommand(interaction, client) {
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
      return interaction.editReply("❌ Database error");
    }

    const enabled = data?.enabled_channels || {};

    const baseId = data?.default_channel || data?.active_channel;
    const baseChannel = baseId
      ? guild.channels.cache.get(baseId)
      : null;

    await guild.roles.fetch();
    await guild.channels.fetch();

    const roleMap = {
      ES: "Spanish",
      DE: "German",
      IT: "Italian",
      KO: "Korean",
      RU: "Russian",
      JA: "Japanese"
    };

    const missingRoles = Object.values(roleMap).filter(
      r => !guild.roles.cache.some(role => role.name === r)
    );

    const missingChannels = [];

    for (const [lang, id] of Object.entries(enabled)) {
      if (lang === "EN") continue;
      if (!id || !guild.channels.cache.get(id)) {
        missingChannels.push(lang);
      }
    }

    let healResult = null;

    try {
      healResult = await autoHeal({ guild, client });
    } catch {
      healResult = { fixed: false };
    }

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("🧪 UniChat Diagnose Report")
      .addFields(
        {
          name: "🏠 Base Channel (EN)",
          value: baseChannel ? "🟢 OK" : "❌ Missing",
          inline: true
        },
        {
          name: "👥 Roles",
          value: missingRoles.length
            ? `⚠️ ${missingRoles.length} missing`
            : "🟢 OK",
          inline: true
        },
        {
          name: "🌍 Channels",
          value: missingChannels.length
            ? `⚠️ ${missingChannels.length} missing`
            : "🟢 OK",
          inline: true
        },
        {
          name: "🔧 Auto-Heal",
          value: healResult?.disabled
            ? "⚠️ Disabled (safe mode)"
            : healResult?.fixed
              ? "🟢 Fixed issues"
              : "ℹ️ Checked",
          inline: false
        }
      )
      .setFooter({ text: "UniChat • Diagnostics Safe Mode" })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    return interaction.editReply("❌ Diagnose failed safely");
  }
}
