import { SlashCommandBuilder } from 'discord.js';
import { redeemReferralCode } from '../services/referralService.js';

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

      const result = await redeemReferralCode(
        interaction.guild.id,
        interaction.user.id,
        code
      );

      if (!result.valid) {
        const errors = {
          INVALID_CODE: '❌ Invalid code',
          SELF_USE: '❌ You cannot use your own code',
          ALREADY_USED: '❌ You already used a referral code'
        };

        return interaction.reply({
          content: errors[result.reason] || '❌ Error',
          ephemeral: true
        });
      }

      return interaction.reply({
        content:
          `🎉 Referral successful!\n\n` +
          `⭐ Owner got +1 referral`,
        ephemeral: true
      });

    } catch (err) {
      console.log('Referral redeem error:', err);

      return interaction.reply({
        content: '❌ Command error occurred',
        ephemeral: true
      });
    }
  }
};
