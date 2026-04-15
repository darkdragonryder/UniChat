import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('devkey')
    .setDescription('Generate license keys (OWNER ONLY)')
    .addStringOption(o =>
      o.setName('type')
        .setDescription('dev, 7day, 14day, 30day, lifetime')
        .setRequired(true)
    ),

  async execute(interaction) {

    // OWNER CHECK
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type')?.toLowerCase();

    const validTypes = ['dev', '7day', '14day', '30day', 'lifetime'];

    if (!validTypes.includes(type)) {
      return interaction.reply({
        content: '❌ Invalid type. Use: dev, 7day, 14day, 30day, lifetime',
        ephemeral: true
      });
    }

    const durationMap = {
      dev: 7,
      '7day': 7,
      '14day': 14,
      '30day': 30,
      lifetime: null
    };

    const days = durationMap[type];

    const key = generateLicenseKey(type, days);

    return interaction.reply({
      content:
        `✅ ${type.toUpperCase()} key generated:\n\n` +
        `\`${key}\``,
      ephemeral: true
    });
  }
};
