import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('uniping')
    .setDescription('Check if the bot is responding'),

  async execute(interaction) {
    // safe immediate response
    await interaction.reply({
      content: '🏓 UniChat is working!',
      ephemeral: true
    });
  }
};
