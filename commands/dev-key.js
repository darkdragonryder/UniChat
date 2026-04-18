import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('devkey')
    .setDescription('Generate license keys (OWNER ONLY)')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('dev, 7day, 14day, 30day, lifetime')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: '❌ No permission',
          ephemeral: true
        });
      }

      const type = interaction.options.getString('type')?.toLowerCase();

      const durationMap = {
        dev: 7,
        '7day': 7,
        '14day': 14,
        '30day': 30,
        lifetime: null
      };

      if (!(type in durationMap)) {
        return interaction.reply({
          content: '❌ Invalid type',
          ephemeral: true
        });
      }

      const days = durationMap[type];

      const result = await generateLicenseKey(type, days);

      const durationText =
        days === null ? 'lifetime' : `${days} days`;

      return interaction.reply({
        content:
          `✅ ${type.toUpperCase()} key generated:\n\n` +
          `🔑 \`${result.key}\`\n\n` +
          `⏳ Duration: **${durationText}**`,
        ephemeral: true
      });

    } catch (err) {
      console.log('devkey error:', err);

      return interaction.reply({
        content: '❌ Failed to generate license key',
        ephemeral: true
      });
    }
  }
};
