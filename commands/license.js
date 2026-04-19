import { SlashCommandBuilder } from 'discord.js';
import { applyLicenseKey } from '../services/unichatCore.js';

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
    await interaction.deferReply({ ephemeral: true });

    try {
      const key = interaction.options.getString('key');

      const result = await applyLicenseKey(
        interaction.guild.id,
        interaction.user.id,
        key
      );

      if (!result.ok) {
        return interaction.editReply(`❌ ${result.reason}`);
      }

      return interaction.editReply(
        `✅ License activated!\n\n` +
        `⭐ Type: **${result.type}**\n` +
        `⏳ Duration: **${result.days ?? 'lifetime'}**`
      );

    } catch (err) {
      console.log(err);
      return interaction.editReply('❌ Activation failed');
    }
  }
};
