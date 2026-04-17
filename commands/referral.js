import { SlashCommandBuilder } from 'discord.js';
import { createReferralCode, getReferral } from '../services/referralService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral')
    .setDescription('Create or view your referral code'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      await interaction.deferReply({ ephemeral: true });

      // =========================
      // CHECK EXISTING CODE
      // =========================
      const existing = await getReferralByOwner(userId);

      if (existing) {
        return interaction.editReply(
          `🔗 Your referral code:\n\n\`${existing.code}\``
        );
      }

      // =========================
      // CREATE NEW CODE
      // =========================
      const code = await createReferralCode(userId);

      return interaction.editReply(
        `🎉 Referral code created!\n\n` +
        `🔗 Your code: \`${code}\`\n\n` +
        `Share this to earn rewards when someone buys premium!`
      );

    } catch (err) {
      console.log('referral command error:', err);

      return interaction.reply({
        content: '❌ Command error occurred',
        ephemeral: true
      });
    }
  }
};

// ==============================
// HELPER (GET BY OWNER)
// ==============================
async function getReferralByOwner(userId) {
  const db = await (await import('../services/db.js')).default;

  return db.get(
    `SELECT * FROM referrals WHERE ownerId = ?`,
    [userId]
  );
}
