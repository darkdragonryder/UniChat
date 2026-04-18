import { SlashCommandBuilder } from 'discord.js';
import { setUserLang } from '../utils/userLang.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your language')
    .addStringOption(opt =>
      opt.setName('lang')
        .setDescription('EN, FR, ES, DE...')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');

    setUserLang(interaction.user.id, lang);

    return interaction.reply({
      content: `✅ Language set to ${lang.toUpperCase()}`,
      ephemeral: true
    });
  }
};
