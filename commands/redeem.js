import { SlashCommandBuilder } from 'discord.js';
import { validateKey } from '../services/licenseStore.js';
import { applyLicenseKey } from '../services/unichatCore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key')
    .addStringOption(o =>
      o.setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const key = interaction.options.getString('key');

      await interaction.deferReply({ ephemeral: true });

      // =========================
      // VALIDATE KEY
      // =========================
      const result = await validateKey(key);

      if (!result.ok) {
        return interaction.editReply('❌ Invalid or unknown license key');
      }

      const license = result.data;

      // =========================
      // ALREADY USED CHECK
      // =========================
      if (license.used) {
        return interaction.editReply('❌ This license has already been used');
      }

      // =========================
      // EXPIRED CHECK
      // =========================
      if (
        license.expiresAt !== null &&
        Date.now() > license.expiresAt
      ) {
        return interaction.editReply('❌ This license has expired');
      }

      // =========================
      // APPLY LICENSE
      // =========================
      let apply;

      try {
        apply = await applyLicenseKey(
          interaction.guild.id,
          interaction.user.id,
          key
        );
      } catch (err) {
        console.log('applyLicenseKey error:', err);
        return interaction.editReply('❌ Failed to apply license');
      }

      if (!apply?.ok) {
        return interaction.editReply('❌ License activation failed');
      }

      // =========================
      // SUCCESS RESPONSE
      // =========================
      return interaction.editReply(
        `✅ License Redeemed!\n\n` +
        `⭐ Type: **${license.type}**\n` +
        `⏳ Duration: **${license.durationDays ?? 'lifetime'}**\n` +
        `🏷️ Guild Locked: **${interaction.guild.name}**`
      );

    } catch (err) {
      console.log('Redeem crash:', err);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: '❌ Command error occurred',
          ephemeral: true
        });
      }
    }
  }
};
