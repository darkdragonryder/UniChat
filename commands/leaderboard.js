import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';
import { getUserBadge } from '../services/leaderboardService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Invite leaderboard'),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);

    const lb = config.referrals?.leaderboard || {};

    if (!Object.keys(lb).length) {
      return interaction.reply({
        content: '📉 No referrals yet.',
        ephemeral: true
      });
    }

    const sorted = Object.entries(lb)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];

    let desc = '';

    for (let i = 0; i < sorted.length; i++) {
      const [userId, count] = sorted[i];

      let user;
      try {
        user = await interaction.client.users.fetch(userId);
      } catch {}

      const badge = getUserBadge(interaction.guild.id, userId);

      desc += `${medals[i] || '🏅'} **${user?.username || 'Unknown'}** — ${count} referrals ${badge}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Referral Leaderboard')
      .setColor(0xFFD700)
      .setDescription(desc)
      .setFooter({ text: 'Resets every 90 days' });

    return interaction.reply({ embeds: [embed] });
  }
};
