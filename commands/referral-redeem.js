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
    const code = interaction.options.getString('code');

    const result = await redeemReferralCode(
      interaction.guild,
      interaction.member,
      code
    );

    if (!result.ok) {
      const map = {
        INVALID_CODE: '❌ Invalid code',
        SELF_USE: '❌ You cannot use your own code',
        RATE_LIMIT: '❌ Too many attempts, try later',
        CODE_SPAM: '❌ Please slow down',
        ALREADY_USED: '❌ This server already used a referral'
      };

      return interaction.reply({
        content: map[result.reason] || '❌ Failed',
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        `🎉 Referral successful!\n\n` +
        `⭐ Total referrals: **${result.total}**`,
      ephemeral: true
    });
  }
};
