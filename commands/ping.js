const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uniping')
    .setDescription('Check if the bot is responding'),

  async execute(interaction) {
    await interaction.reply('🏓 UniChat is working!');
  },
};
