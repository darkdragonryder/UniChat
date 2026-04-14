import { SlashCommandBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from '../utils/licenses.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a premium license key')
    .addStringOption(opt =>
      opt.setName('key')
        .setDescription('Your license key')
        .setRequired(true)
    ),

  async execute(interaction) {

    const key = interaction.options.getString('key');
    const guildId = interaction.guild.id;

    const config = getGuildConfig(guildId);

    // already premium
    if (config.premium) {
      return interaction.reply({
        content: '💎 This server already has premium activated.',
        ephemeral: true
      });
    }

    // validate key
    const result = validateKey(key);

    if (!result.valid) {
      return interaction.reply({
        content: `❌ Invalid key: ${result.reason}`,
        ephemeral: true
      });
    }

    // use key
    useKey(key, guildId);

    // activate premium
    config.premium = true;
    config.licenseKey = key;
    config.mode = 'auto';

    saveGuildConfig(guildId, config);

    return interaction.reply({
      content:
        `💎 **Premium Activated!**\n\n` +
        `✔ Auto translation enabled\n` +
        `✔ License linked to this server\n` +
        `✔ Mode: AUTO`,
      ephemeral: false
    });
  }
};
