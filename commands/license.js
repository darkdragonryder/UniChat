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
    const key = interaction.options.getString('key');

    // =========================
    // APPLY LICENSE (SINGLE SOURCE OF TRUTH)
    // =========================
    const result = applyLicenseKey(
      interaction.guild.id,
      interaction.user.id,
      key
    );

    if (!result?.ok) {
      return interaction.reply({
        content: `❌ ${result?.reason || 'Invalid or used key'}`,
        ephemeral: true
      });
    }

    // =========================
    // RESPONSE
    // =========================
    return interaction.reply({
      content:
        `✅ License activated!\n\n` +
        `⭐ Type: **${result.type}**\n` +
        `⏳ Duration: **${result.days ?? 'lifetime'} days**`,
      ephemeral: true
    });
  }
};
