import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('uniping')
    .setDescription('Check if the bot is responding'),

  async execute(interaction) {
    await interaction.reply('🏓 UniChat is working!');
  }
};
