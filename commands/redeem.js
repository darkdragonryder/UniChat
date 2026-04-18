import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { applyLicenseKey } from '../services/unichatCore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a premium license key')
    .addStringOption(option =>
      option
        .setName('key')
        .setDescription('Your license key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;

    const config = getGuildConfig(guildId);

    config.referrals ||= {
      leaderboard: {},
      usedServers: {}
    };

    if (config.premium) {
      return interaction.reply({
        content: '⚠️ This server already has premium active.',
        ephemeral: true
      });
    }

    // ✅ FIX: must await
    const applied = await applyLicenseKey(guildId, interaction.user.id, key);

    if (!applied?.ok) {
      return interaction.reply({
        content: '❌ Invalid, used, or expired license key.',
        ephemeral: true
      });
    }

    saveGuildConfig(guildId, config);

    const durationText =
      applied.days === null || applied.type === 'lifetime'
        ? 'lifetime'
        : `${applied.days} days`;

    const expiryText = applied.expiry
      ? `<t:${Math.floor(applied.expiry / 1000)}:R>`
      : 'lifetime';

    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Type: **${applied.type}**\n` +
        `⏳ Duration: **${durationText}**\n` +
        `📅 Expires: ${expiryText}`,
      ephemeral: true
    });
  }
};
