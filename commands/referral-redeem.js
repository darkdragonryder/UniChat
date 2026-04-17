import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral-redeem')
    .setDescription('Redeem a referral code')
    .addStringOption(o =>
      o.setName('code')
        .setDescription('Referral code')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const code = interaction.options.getString('code');

      const config = getGuildConfig(interaction.guild.id);

      // =========================
      // SAFE INIT
      // =========================
      config.referrals ??= {};
      config.referrals.codes ??= {};
      config.referrals.usedServers ??= {};
      config.referrals.leaderboard ??= {};

      const ref = config.referrals.codes[code];

      if (!ref) {
        return interaction.reply({
          content: '❌ Invalid code',
          ephemeral: true
        });
      }

      // self-use protection
      if (ref.ownerId === interaction.user.id) {
        return interaction.reply({
          content: '❌ You cannot use your own code',
          ephemeral: true
        });
      }

      // already used check
      if (config.referrals.usedServers[interaction.user.id]) {
        return interaction.reply({
          content: '❌ You already used a referral code',
          ephemeral: true
        });
      }

      // ensure array exists
      ref.usedBy ??= [];

      // mark used
      config.referrals.usedServers[interaction.user.id] = {
        code,
        usedAt: Date.now()
      };

      ref.usedBy.push(interaction.user.id);

      // update leaderboard
      config.referrals.leaderboard[ref.ownerId] =
        (config.referrals.leaderboard[ref.ownerId] || 0) + 1;

      const total = config.referrals.leaderboard[ref.ownerId];

      saveGuildConfig(interaction.guild.id, config);

      return interaction.reply({
        content:
          `🎉 Referral successful!\n\n` +
          `⭐ Total referrals: **${total}**`,
        ephemeral: true
      });

    } catch (err) {
      console.log('referral-redeem error:', err);

      return interaction.reply({
        content: '❌ Command error occurred',
        ephemeral: true
      });
    }
  }
};
