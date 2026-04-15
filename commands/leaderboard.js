import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Referral leaderboard'),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);
    const lb = config?.referrals?.leaderboard || {};

    const sorted = Object.entries(lb)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (!sorted.length) {
      return interaction.reply({
        content: '📉 No referrals yet.',
        ephemeral: true
      });
    }

    let text = '';

    for (let i = 0; i < sorted.length; i++) {
      const [id, count] = sorted[i];

      const user = await interaction.client.users.fetch(id).catch(() => null);

      text += `${i + 1}. **${user?.username || 'Unknown'}** — ${count}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Referral Leaderboard')
      .setColor(0xFFD700)
      .setDescription(text);

    return interaction.reply({ embeds: [embed] });
  }
};
