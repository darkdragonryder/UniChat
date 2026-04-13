const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// simple safe fallback storage if your util breaks
const path = './config.json';

module.exports = {
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
      config = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (err) {
      config = {};
    }

    config.languages = config.languages || {};
    config.languages[interaction.user.id] = lang;

    fs.writeFileSync(path, JSON.stringify(config, null, 2));

    await interaction.reply(`✅ Language set to ${lang}`);
  }
};
