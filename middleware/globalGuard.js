import { isGuildLicensed } from '../services/licenseCheck.js';

export async function globalGuard(interaction, command) {
  try {
    if (!command?.meta?.licensed) return true;

    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.reply({
        content: '❌ Guild only command.',
        ephemeral: true
      });
      return false;
    }

    const ok = await isGuildLicensed(guildId);

    if (!ok) {
      await interaction.reply({
        content: '❌ This server is not licensed.',
        ephemeral: true
      });
      return false;
    }

    return true;

  } catch (err) {
    console.error('globalGuard error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Internal error.',
        ephemeral: true
      });
    }

    return false;
  }
}
