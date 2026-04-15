import { SlashCommandBuilder } from 'discord.js';
import { addLicenseKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate license key (OWNER ONLY)'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const key = 'PREM-' + Math.random().toString(36).substring(2, 18).toUpperCase();

    addLicenseKey(key, 'dev', 30);

    return interaction.reply({
      content: `🔑 Key generated:\n\`${key}\``,
      ephemeral: true
    });
  }
};
