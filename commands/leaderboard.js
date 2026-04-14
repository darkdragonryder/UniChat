import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the invite leaderboard'),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);

    const lb = config?.inviteLeaderboard?.users || {};

    const entries = Object.entries(lb);

    if (entries.length === 0) {
      return interaction.reply({
        content: '📉 No invite data yet. Start inviting people!',
        ephemeral: true
      });
    }

    // sort users by invites
    const sorted = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let description = '';

    let position = 1;

    const medals = ['🥇', '🥈', '🥉'];

    for (const [userId, count] of sorted) {
      let displayName = 'Unknown User';

      try {
        const user = await interaction.client.users.fetch(userId);
        displayName = user.username;
      } catch {
        // keep fallback name
      }

      const medal = medals[position - 1] || `#${position}`;

      description += `${medal} **${displayName}** — **${count} invites**\n`;

      position++;
    }

    // 🏆 optional champion highlight
    const top = sorted[0];
    const topUserId = top?.[0];

    let championText = '';

    if (topUserId) {
      try {
        const topUser = await interaction.client.users.fetch(topUserId);
        championText = `\n🏆 Current Leader: **${topUser.username}**`;
      } catch {}
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Invite Leaderboard')
      .setColor(0x00AEFF)
      .setDescription(description + championText)
      .setFooter({
        text: 'Cycle resets every 90 days'
      })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }
};
