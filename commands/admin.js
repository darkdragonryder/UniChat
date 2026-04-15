import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin controls')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(cmd =>
      cmd.setName('auto')
        .setDescription('Toggle auto translation')
        .addBooleanOption(opt =>
          opt.setName('enabled').setDescription('Enable auto mode').setRequired(true)
        )
    )
    .addSubcommand(cmd =>
      cmd.setName('language')
        .setDescription('Set default server language')
        .addStringOption(opt =>
          opt.setName('lang').setDescription('Language code (e.g. en, fr, jp)').setRequired(true)
        )
    ),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (!sub) {
      return interaction.reply({
        content: '❌ Missing subcommand',
        ephemeral: true
      });
    }

    // ===============================
    // AUTO MODE TOGGLE
    // ===============================
    if (sub === 'auto') {
      const enabled = interaction.options.getBoolean('enabled');

      config.mode = enabled ? 'auto' : 'reaction';

      saveGuildConfig(interaction.guild.id, config);

      return interaction.reply({
        content: `✅ Auto mode is now **${config.mode}**`,
        ephemeral: true
      });
    }

    // ===============================
    // LANGUAGE SET
    // ===============================
    if (sub === 'language') {
      const lang = interaction.options.getString('lang');

      if (!lang || lang.length > 10) {
        return interaction.reply({
          content: '❌ Invalid language code',
          ephemeral: true
        });
      }

      // ensure structure
      if (!config.languages) config.languages = {};

      config.defaultLanguage = lang.toLowerCase();

      saveGuildConfig(interaction.guild.id, config);

      return interaction.reply({
        content: `🌍 Default language set to **${config.defaultLanguage}**`,
        ephemeral: true
      });
    }
  }
};
