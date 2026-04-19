import { SlashCommandBuilder } from 'discord.js';

// SAFE IMPORT (prevents bot crash if service is broken)
let getLeaderboard;

try {
  ({ getLeaderboard } = await import('../services/referralService.js'));
} catch (err) {
  console.log('⚠️ referralService failed to load:', err.message);
  getLeaderboard = async () => [];
}

export default {
  data: new SlashCommandBuilder()
    .setName('referral-leaderboard')
    .setDescription('View top referral users'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const rows = await getLeaderboard(interaction.guild.id);

      if (!rows || rows.length === 0) {
        return interaction.editReply('📉 No referrals yet.');
      }

      const top = rows.slice(0, 10);

      const formatted = top
        .map((r, i) =>
          `**${i + 1}.** <@${r.ownerId}> — **${r.total}** referrals`
        )
        .join('\n');

      return interaction.editReply(
        `🏆 **Referral Leaderboard**\n\n${formatted}`
      );

    } catch (err) {
      console.log('Leaderboard error:', err);

      return interaction.editReply('❌ Failed to load leaderboard');
    }
  }
};
