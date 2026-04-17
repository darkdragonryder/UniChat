import { SlashCommandBuilder } from 'discord.js';
import { createReferralCode } from '../services/referralService.js';

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default {
  data: new SlashCommandBuilder()
    .setName('referral-create')
    .setDescription('Create a referral code'),

  async execute(interaction) {
    try {
      const code = makeCode();

      await createReferralCode(
        interaction.guild.id,
        interaction.user.id,
        code
      );

      return interaction.reply({
        content:
          `🎉 Referral code created!\n\n` +
          `🔑 Code: **${code}**`,
        ephemeral: true
      });

    } catch (err) {
      console.log('Referral create error:', err);

      return interaction.reply({
        content: '❌ Failed to create referral code',
        ephemeral: true
      });
    }
  }
};
