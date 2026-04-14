import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// temporary in-memory key store (replace later with database if needed)
const validKeys = new Set([
  'FREE-TRIAL-14D',
  'PREMIUM-KEY-1',
  'VIP-ACCESS-XYZ'
]);

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

    // -----------------------------
    // CHECK IF ALREADY PREMIUM
    // -----------------------------
    if (config.premium) {
      return interaction.reply({
        content: '⚠️ This server already has premium activated.',
        ephemeral: true
      });
    }

    // -----------------------------
    // VALIDATE KEY
    // -----------------------------
    if (!validKeys.has(key)) {
      return interaction.reply({
        content: '❌ Invalid or expired license key.',
        ephemeral: true
      });
    }

    // -----------------------------
    // CONSUME KEY (one-time use)
    // -----------------------------
    validKeys.delete(key);

    // -----------------------------
    // ACTIVATE PREMIUM
    // -----------------------------
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    config.premium = true;
    config.mode = 'auto';
    config.licenseKey = key;
    config.premiumStart = now;
    config.premiumExpiry = now + thirtyDays;

    saveGuildConfig(guildId, config);

    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Auto Translation Enabled\n` +
        `✔ 30 Day Access Granted\n` +
        `✔ License Verified Successfully`,
      ephemeral: true
    });
  }
};
