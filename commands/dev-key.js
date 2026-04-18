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

      let type = interaction.options.getString('type');

      if (!type) {
        return interaction.reply({
          content: '❌ Missing type',
          ephemeral: true
        });
      }

      type = type.trim().toLowerCase();

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

      console.log('🔑 TYPE:', type);
      console.log('🔑 DAYS:', days);

      const result = await generateLicenseKey(type, days);

      const key = result.key;

      const durationText =
        days === null ? 'lifetime' : `${days} days`;

      return interaction.reply({
        content:
          `✅ ${type.toUpperCase()} key generated:\n\n` +
          `🔑 \`${key}\`\n\n` +
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
