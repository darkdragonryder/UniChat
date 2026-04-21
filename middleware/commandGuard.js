import { isGuildLicensed } from '../services/licenseCheck.js';

/**
 * GLOBAL COMMAND GUARD
 * Handles ALL license checks automatically
 */
export async function globalGuard(interaction, command) {
  try {
    const guildId = interaction.guild?.id;

    // If command does NOT require license → allow
    if (!command?.meta?.licensed) {
      return true;
    }

    if (!guildId) {
      await interaction.reply({
        content: '❌ Guild only command.',
        ephemeral: true
      });
      return false;
    }

    const licensed = await isGuildLicensed(guildId);

    if (!licensed) {
      await interaction.reply({
        content: '❌ This server is not licensed.',
        ephemeral: true
      });
      return false;
    }

    return true;

  } catch (err) {
    console.error('Global guard error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Internal error.',
        ephemeral: true
      });
    }

    return false;
  }
}
