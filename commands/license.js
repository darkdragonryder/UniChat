import { SlashCommandBuilder } from 'discord.js';
import { validateKey } from '../services/licenseStore.js';
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
    try {
      const key = interaction.options.getString('key');

      // 🔥 IMPORTANT: prevents timeout
      await interaction.deferReply({ ephemeral: true });

      // =========================
      // VALIDATE KEY
      // =========================
      const result = validateKey(key);

      if (!result.valid) {
        return interaction.editReply(`❌ ${result.reason}`);
      }

      // =========================
      // APPLY LICENSE
      // =========================
      let apply;

      try {
        apply = applyLicenseKey(
          interaction.guild.id,
          interaction.user.id,
          key
        );
      } catch (err) {
        console.log('applyLicenseKey error:', err);
        return interaction.editReply('❌ Internal license error');
      }

      if (!apply || !apply.ok) {
        return interaction.editReply('❌ Failed to apply license');
      }

      // =========================
      // RESPONSE
      // =========================
      return interaction.editReply(
        `✅ License activated!\n\n` +
        `⭐ Type: **${apply.type}**\n` +
        `⏳ Duration: **${apply.days ?? 'lifetime'}**`
      );

    } catch (err) {
      console.log('License command crash:', err);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: '❌ Command error occurred',
          ephemeral: true
        });
      }
    }
  }
};
