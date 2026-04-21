import { SlashCommandBuilder } from 'discord.js';
import { getGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license-info')
    .setDescription('Check license status'),

  async execute(interaction) {
    const config = await getGuildSetup(interaction.guild.id);

    if (!config) {
      return interaction.reply({ content: '❌ No data', ephemeral: true });
    }

    const active =
      config.premium &&
      (!config.premiumexpiry || Date.now() < config.premiumexpiry);

    return interaction.reply({
      content:
        `🔐 License Status\n` +
        `Active: ${active}\n` +
        `Key: ${config.licensekey || 'none'}\n`,
      ephemeral: true
    });
  }
};
