import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/UniChatCore.js';

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

    // =========================
    // SAFETY INIT
    // =========================
    config.referrals ||= {
      leaderboard: {},
      usedServers: {}
    };

    // =========================
    // ALREADY PREMIUM CHECK
    // =========================
    if (config.premium) {
      return interaction.reply({
        content: '⚠️ This server already has premium active.',
        ephemeral: true
      });
    }

    // =========================
    // VALIDATE KEY
    // =========================
    const result = validateKey(key);

    if (!result?.valid) {
      return interaction.reply({
        content: '❌ Invalid or expired license key.',
        ephemeral: true
      });
    }

    // =========================
    // APPLY PREMIUM (CORE LOGIC)
    // =========================
    const applied = applyLicenseKey(guildId, interaction.user.id, key);

    if (!applied?.ok) {
      return interaction.reply({
        content: '❌ Failed to activate license.',
        ephemeral: true
      });
    }

    // =========================
    // MARK KEY USED (PERSISTENT STORE)
    // =========================
    useKey(key, guildId);

    // =========================
    // SAVE CONFIG
    // =========================
    saveGuildConfig(guildId, config);

    // =========================
    // RESPONSE
    // =========================
    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Type: **${applied.type}**\n` +
        `⏳ Duration: **${applied.days ?? 'lifetime'} days**\n` +
        `✔ License Verified`,
      ephemeral: true
    });
  }
};
