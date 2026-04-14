import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey, applyKeyToConfig } from '../utils/licenseKeys.js';

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

    // =====================================================
    // CHECK IF ALREADY PREMIUM
    // =====================================================
    if (config.premium) {
      return interaction.reply({
        content: '⚠️ This server already has premium activated.',
        ephemeral: true
      });
    }

    // =====================================================
    // VALIDATE KEY (NEW DATABASE SYSTEM)
    // =====================================================
    const result = validateKey(key);

    if (!result.valid) {
      return interaction.reply({
        content: `❌ Invalid or already used license key.`,
        ephemeral: true
      });
    }

    const keyEntry = result.entry;

    // =====================================================
    // APPLY KEY TO CONFIG (AUTO HANDLES LIFETIME / TEMP)
    // =====================================================
    applyKeyToConfig(config, keyEntry, key);

    // =====================================================
    // MARK KEY AS USED IN DATABASE
    // =====================================================
    useKey(key, guildId);

    // =====================================================
    // SAVE GUILD CONFIG
    // =====================================================
    saveGuildConfig(guildId, config);

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================
    const durationText =
      keyEntry.durationDays === -1
        ? 'Lifetime Access'
        : `${keyEntry.durationDays} Days`;

    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Mode: Auto Translation Enabled\n` +
        `✔ Duration: ${durationText}\n` +
        `✔ License Verified\n` +
        `✔ System Fully Unlocked`,
      ephemeral: true
    });
  }
};
