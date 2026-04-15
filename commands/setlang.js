import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your translation language')
    .addStringOption(option =>
      option
        .setName('lang')
        .setDescription('Language code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');
    const userId = interaction.user.id;

    const supported = [
      'en', 'en-US', 'en-GB',
      'fr', 'es', 'de', 'it', 'pt', 'pt-PT', 'pt-BR',
      'ru',
      'ja', 'ko', 'zh',
      'ar'
    ];

    // Validate language
    if (!supported.includes(lang)) {
      return interaction.reply({
        content: `❌ Unsupported language.\n\nSupported:\n${supported.join(', ')}`,
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    config.languages ||= {};
    config.languages[userId] = lang;

    saveGuildConfig(interaction.guild.id, config);

    return interaction.reply({
      content: `✅ Your language has been set to **${lang}**`,
      ephemeral: true
    });
  }
};
