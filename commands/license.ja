import { SlashCommandBuilder } from 'discord.js';
import { activateLicense } from '../services/licenseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('Activate a license key')
    .addStringOption(opt =>
      opt
        .setName('key')
        .setDescription('Your license key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');

    const result = activateLicense(interaction.guild.id, key);

    if (!result.ok) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `✅ ${result.message}`,
      ephemeral: true
    });
  }
};
