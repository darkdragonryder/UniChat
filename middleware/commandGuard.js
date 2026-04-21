import { isGuildLicensed } from '../services/licenseCheck.js';

/**
 * Middleware wrapper for licensed commands
 */
export function withLicenseCheck(handler) {
  return async (interaction) => {
    try {
      const guildId = interaction.guild?.id;

      if (!guildId) {
        return interaction.reply({
          content: '❌ Guild only command.',
          ephemeral: true
        });
      }

      const licensed = await isGuildLicensed(guildId);

      if (!licensed) {
        return interaction.reply({
          content: '❌ This server is not licensed.',
          ephemeral: true
        });
      }

      return await handler(interaction);

    } catch (err) {
      console.error('Command guard error:', err);

      if (!interaction.replied) {
        return interaction.reply({
          content: '❌ Internal error.',
          ephemeral: true
        });
      }
    }
  };
}
