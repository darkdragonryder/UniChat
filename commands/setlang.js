import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your translation language')
    .addStringOption(option =>
      option
        .setName('lang')
        .setDescription('Language code (en, fr, es, de, it, pt)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');
    const userId = interaction.user.id;

    const supported = ['en', 'fr', 'es', 'de', 'it', 'pt'];

    // Validate language input
    if (!supported.includes(lang)) {
      return interaction.reply({
        content: `❌ Unsupported language. Use: ${supported.join(', ')}`,
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    // Ensure structure exists
    if (!config.languages) config.languages = {};

    // ✅ THIS IS THE IMPORTANT LINE YOU ASKED ABOUT
    config.languages[userId] = lang;

    // Save to file
    saveGuildConfig(interaction.guild.id, config);

    return interaction.reply({
      content: `✅ Your language has been set to **${lang}**`,
      ephemeral: import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your translation language')
    .addStringOption(option =>
      option
        .setName('lang')
        .setDescription('Language code (en, fr, es, de, it, pt, ru, ja, ko, zh, ar)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');
    const userId = interaction.user.id;

    // =====================
    // FULL GLOBAL LANGUAGE SET
    // =====================
    const supported = [
      // English
      'en', 'en-US', 'en-GB',

      // European core
      'fr', 'es', 'de', 'it', 'pt', 'pt-PT', 'pt-BR',

      // Eastern Europe / Russia
      'ru',

      // Asia
      'ja', 'ko', 'zh',

      // Middle East / global expansion
      'ar'
    ];

    // =====================
    // VALIDATION
    // =====================
    if (!supported.includes(lang)) {
      return interaction.reply({
        content: `❌ Unsupported language.\n\nSupported languages:\n${supported.join(', ')}`,
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    if (!config.languages) {
      config.languages = {};
    }

    config.languages[userId] = lang;

    saveGuildConfig(interaction.guild.id, config);

    return interaction.reply({
      content: `✅ Your language has been set to **${lang}**`,
      ephemeral: true
    });
  }
};
