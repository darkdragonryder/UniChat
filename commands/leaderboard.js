import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';
import { getUserBadge } from '../services/leaderboardService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Invite leaderboard'),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);

    const lb = config?.referrals?.leaderboard || {};

    if (!lb || Object.keys(lb).length === 0) {
      return interaction.reply({
        content: '📉 No referrals yet.',
        ephemeral: true
      });
    }

    const sorted = Object.entries(lb)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];

    // batch fetch users (REDUCES API CALLS)
    const userIds = sorted.map(([id]) => id);

    const users = await Promise.all(
      userIds.map(id =>
        interaction.client.users.fetch(id).catch(() => null)
      )
    );

    const userMap = new Map(
      userIds.map((id, i) => [id, users[i]])
    );

    let desc = '';

    for (let i = 0; i < sorted.length; i++) {
      const [userId, count] = sorted[i];

      const user = userMap.get(userId);
      const badge = getUserBadge(interaction.guild.id, userId) || '🥉 Rookie';

      desc += `${medals[i] || '🏅'} **${user?.username || 'Unknown User'}** — ${count} referrals ${badge}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Referral Leaderboard')
      .setColor(0xFFD700)
      .setDescription(desc || 'No data available')
      .setFooter({ text: 'Resets every 90 days' });

    return interaction.reply({ embeds: [embed] });
  }
};
