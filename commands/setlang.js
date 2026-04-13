import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your language')
    .addStringOption(option =>
      option
        .setName('lang')
        .setDescription('Language code (e.g. en, es, fr)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');

    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch {
      config = {};
    }

    config.languages = config.languages || {};
    config.languages[interaction.user.id] = lang;

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply(`✅ Language set to ${lang}`);
  }
};
