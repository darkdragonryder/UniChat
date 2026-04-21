import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Shows bot status'),

  async execute(interaction) {
    const guildCount = interaction.client.guilds.cache.size;

    return interaction.reply({
      content:
        `🤖 **Bot Online**\n` +
        `🏠 Guilds: **${guildCount}**\n` +
        `⚡ Status: Healthy`,
      ephemeral: true
    });
  }
};
