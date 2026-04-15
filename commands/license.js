import { SlashCommandBuilder } from 'discord.js';
import { validateKey, useKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('Activate a license key')
    .addStringOption(o =>
      o.setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const key = interaction.options.getString('key');

    const result = validateKey(key);

    if (!result.valid) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    useKey(key, interaction.guild.id);

    return interaction.reply({
      content: '✅ License activated successfully',
      ephemeral: true
    });
  }
};
