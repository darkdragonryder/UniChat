import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the invite leaderboard'),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);

    const lb = config.inviteLeaderboard;

    if (!lb || !lb.users || Object.keys(lb.users).length === 0) {
      return interaction.reply({
        content: '📉 No invite data yet. Start inviting people!',
        ephemeral: true
      });
    }

    // sort users by invites
    const sorted = Object.entries(lb.users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let description = '';

    let position = 1;

    for (const [userId, count] of sorted) {
      try {
        const user = await interaction.client.users.fetch(userId);

        description += `**#${position}** ${user.username} — **${count} invites**\n`;
      } catch {
        description += `**#${position}** Unknown User — **${count} invites**\n`;
      }

      position++;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Invite Leaderboard')
      .setColor(0x00AEFF)
      .setDescription(description)
      .setFooter({
        text: `Cycle resets every 90 days`
      })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }
};
