import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a license key')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('7day, 30day, lifetime')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ No permission', ephemeral: true });
      }

      const type = interaction.options.getString('type');

      const map = {
        '7day': 7,
        '30day': 30,
        'lifetime': null
      };

      if (!(type in map)) {
        return interaction.reply({ content: '❌ Invalid type', ephemeral: true });
      }

      const key = await generateLicenseKey(type, map[type]);

      return interaction.reply({
        content:
          `🔑 Key generated:\n\n` +
          `\`${key}\`\n\n` +
          `Type: **${type}**`,
        ephemeral: true
      });

    } catch (err) {
      console.log(err);
      return interaction.reply({ content: '❌ Failed to generate key', ephemeral: true });
    }
  }
};
