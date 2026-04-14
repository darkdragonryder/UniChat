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
          opt.setName('enabled').setRequired(true)
        )
    )
    .addSubcommand(cmd =>
      cmd.setName('language')
        .setDescription('Set default server language')
        .addStringOption(opt =>
          opt.setName('lang').setRequired(true)
        )
    ),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guild.id);

    const sub = interaction.options.getSubcommand();

    if (sub === 'auto') {
      config.mode = interaction.options.getBoolean('enabled')
        ? 'auto'
        : 'reaction';

      saveGuildConfig(interaction.guild.id, config);

      return interaction.reply({
        content: `✅ Auto mode: ${config.mode}`,
        ephemeral: true
      });
    }

    if (sub === 'language') {
      const lang = interaction.options.getString('lang');

      config.defaultLanguage = lang;

      saveGuildConfig(interaction.guild.id, config);

      return interaction.reply({
        content: `🌍 Default language set to **${lang}**`,
        ephemeral: true
      });
    }
  }
};
