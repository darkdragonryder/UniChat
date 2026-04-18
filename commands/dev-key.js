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
      // ==============================
      // OWNER CHECK
      // ==============================
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

      // ==============================
      // DURATION MAP
      // ==============================
      const durationMap = {
        dev: 7,
        '7day': 7,
        '14day': 14,
        '30day': 30,
        lifetime: null
      };

      const days = durationMap[type];

      console.log('🔑 Generating license:', type, days);

      // ==============================
      // GENERATE KEY
      // ==============================
      const key = generateLicenseKey(type, days);

      console.log('✅ Generated key:', key);

      // ==============================
      // FORMAT DURATION TEXT
      // ==============================
      let durationText;

      if (days === null) {
        durationText = 'lifetime';
      } else {
        durationText = `${days} days`;
      }

      // ==============================
      // RESPONSE
      // ==============================
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
