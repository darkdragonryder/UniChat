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
    const key = interaction.options.getString('key');

    // =========================
    // VALIDATE KEY
    // =========================
    const result = validateKey(key);

    if (!result.valid) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    // =========================
    // APPLY LICENSE (ONLY SOURCE OF TRUTH)
    // =========================
    const apply = applyLicenseKey(
      interaction.guild.id,
      interaction.user.id,
      key
    );

    if (!apply.ok) {
      return interaction.reply({
        content: `❌ Failed to apply license`,
        ephemeral: true
      });
    }

    // =========================
    // RESPONSE
    // =========================
    return interaction.reply({
      content:
        `✅ License activated!\n\n` +
        `⭐ Type: **${apply.type}**\n` +
        `⏳ Duration: **${apply.days ?? 'lifetime'}**`,
      ephemeral: true
    });
  }
};
