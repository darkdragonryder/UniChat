import { SlashCommandBuilder } from 'discord.js';
import { createReferralCode } from '../services/referralService.js';
import db from '../services/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral')
    .setDescription('Create or view your referral code'),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      await interaction.deferReply({ ephemeral: true });

      // =========================
      // CHECK EXISTING CODE
      // =========================
      const existing = await db.get(
        `SELECT * FROM referral_codes WHERE guildId = ? AND ownerId = ?`,
        [guildId, userId]
      );

      if (existing) {
        return interaction.editReply(
          `🔗 Your referral code:\n\n\`${existing.code}\``
        );
      }

      // =========================
      // CREATE NEW CODE
      // =========================
      const code = await createReferralCode(guildId, userId);

      return interaction.editReply(
        `🎉 Referral code created!\n\n` +
        `🔗 Your code: \`${code}\`\n\n` +
        `Share this to earn rewards when someone buys premium!`
      );

    } catch (err) {
      console.log('referral command error:', err);

      if (!interaction.replied) {
        return interaction.reply({
          content: '❌ Command error occurred',
          ephemeral: true
        });
      }
    }
  }
};
