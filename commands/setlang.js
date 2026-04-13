import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your translation language')
    .addStringOption(option =>
      option
        .setName('lang')
        .setDescription('Language code (en, fr, es, etc)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');

    const config = getGuildConfig(interaction.guild.id);

    config.languages = config.languages || {};
    config.languages[interaction.user.id] = lang;

    saveGuildConfig(interaction.guild.id, config);

    await interaction.reply({
      content: `✅ Your language has been set to **${lang}**`,
      ephemeral: true
    });
  }
};
