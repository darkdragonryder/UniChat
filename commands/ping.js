import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check bot'),
  async execute(i) {
    await i.reply('🏓 UniChat is working!');
  }
};