import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from '../utils/licenses.js';

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
    // ALREADY PREMIUM CHECK
    // =========================
    if (config.premium) {
      return interaction.reply({
        content: '⚠️ This server already has premium active.',
        ephemeral: true
      });
    }

    // =========================
    // VALIDATE LICENSE KEY
    // =========================
    const result = validateKey(key);

    if (!result.valid) {
      return interaction.reply({
        content: '❌ Invalid or expired license key.',
        ephemeral: true
      });
    }

    // =========================
    // CONSUME KEY
    // =========================
    useKey(key, guildId);

    // =========================
    // ACTIVATE PREMIUM
    // =========================
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    config.premium = true;
    config.mode = 'auto';
    config.licenseKey = key;
    config.premiumStart = now;
    config.premiumExpiry = now + thirtyDays;

    // =========================
    // 🎁 REFERRAL REWARD TRIGGER
    // =========================
    if (config.referredBy) {
      const ownerId = config.referredBy.ownerId;

      if (ownerId) {
        if (!config.referrals.leaderboard[ownerId]) {
          config.referrals.leaderboard[ownerId] = 0;
        }

        config.referrals.leaderboard[ownerId] += 1;

        try {
          const user = await interaction.client.users.fetch(ownerId);

          if (user) {
            await user.send(
              `🎉 You earned a referral reward!\n` +
              `A server you referred just activated premium!`
            );
          }
        } catch (err) {
          console.log("❌ Failed to notify referrer");
        }
      }
    }

    // =========================
    // SAVE CONFIG
    // =========================
    saveGuildConfig(guildId, config);

    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Auto Translation Enabled\n` +
        `✔ 30 Day Access Granted\n` +
        `✔ License Verified\n` +
        `${config.referredBy ? '🎁 Referral Reward Applied!' : ''}`,
      ephemeral: true
    });
  }
};
