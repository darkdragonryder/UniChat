import { SlashCommandBuilder } from 'discord.js';
import {
  getReferral,
  useReferral,
  hasUserUsedReferral,
  getReferralCount
} from '../services/referralService.js';

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
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;
      const code = interaction.options.getString('code');

      await interaction.deferReply({ ephemeral: true });

      // =========================
      // CHECK CODE EXISTS
      // =========================
      const ref = await getReferral(code);

      if (!ref) {
        return interaction.editReply('❌ Invalid code');
      }

      // =========================
      // SELF USE BLOCK
      // =========================
      if (ref.ownerId === userId) {
        return interaction.editReply('❌ You cannot use your own code');
      }

      // =========================
      // ALREADY USED CHECK
      // =========================
      const alreadyUsed = await hasUserUsedReferral(guildId, userId);

      if (alreadyUsed) {
        return interaction.editReply('❌ You already used a referral code');
      }

      // =========================
      // APPLY REFERRAL
      // =========================
      const result = await useReferral(guildId, userId, code);

      if (!result.ok) {
        return interaction.editReply(`❌ ${result.reason}`);
      }

      const total = await getReferralCount(guildId, result.ownerId);

      return interaction.editReply(
        `🎉 Referral successful!\n\n` +
        `⭐ Total referrals: **${total}**`
      );

    } catch (err) {
      console.log('referral-redeem error:', err);

      if (!interaction.replied) {
        return interaction.reply({
          content: '❌ Command error occurred',
          ephemeral: true
        });
      }
    }
  }
};
