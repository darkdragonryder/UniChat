import { SlashCommandBuilder } from 'discord.js';
import { generateLicenseKey } from '../services/licenseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a license key (OWNER ONLY)')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('dev or lifetime')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type')?.toLowerCase();

    if (!['dev', 'lifetime'].includes(type)) {
      return interaction.reply({
        content: '❌ Invalid type. Use dev or lifetime',
        ephemeral: true
      });
    }

    const result = generateLicenseKey(interaction.guild.id, type);

    if (!result.ok) {
      return interaction.reply({
        content: `❌ Failed: ${result.reason}`,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `🔑 Generated ${type.toUpperCase()} Key:\n\`${result.key}\``,
      ephemeral: true
    });
  }
};
