import { SlashCommandBuilder } from 'discord.js';
import { getLeaderboard } from '../services/referralService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('referral-leaderboard')
    .setDescription('View top referral users'),

  async execute(interaction) {
    try {
      const rows = await getLeaderboard(interaction.guild.id);

      if (!rows.length) {
        return interaction.reply({
          content: '📉 No referrals yet.',
          ephemeral: true
        });
      }

      const top = rows.slice(0, 10);

      const formatted = top
        .map((r, i) =>
          `**${i + 1}.** <@${r.ownerId}> — **${r.total}** referrals`
        )
        .join('\n');

      return interaction.reply({
        content:
          `🏆 **Referral Leaderboard**\n\n` +
          formatted,
        ephemeral: true
      });

    } catch (err) {
      console.log('Leaderboard error:', err);

      return interaction.reply({
        content: '❌ Failed to load leaderboard',
        ephemeral: true
      });
    }
  }
};
