import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a license key (OWNER ONLY)')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Key type (7day, 30day, lifetime)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Duration in days (use 0 for lifetime)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // OWNER CHECK
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.editReply('❌ Owner only');
      }

      const type = interaction.options.getString('type');
      const daysInput = interaction.options.getInteger('days');

      const durationDays =
        daysInput === 0
          ? null
          : (daysInput ?? (type === '7day' ? 7 : type === '30day' ? 30 : null));

      const key = await generateLicenseKey(type, durationDays);

      return interaction.editReply(
        `🔑 **License Generated**\n\n\`${key}\``
      );

    } catch (err) {
      console.error('GENKEY ERROR:', err);
      return interaction.editReply('❌ Failed to generate key');
    }
  }
};
