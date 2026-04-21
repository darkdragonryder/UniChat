import { validateLicense } from '../api/licenseAPI.js';

export async function licenseGuard(interaction, next) {

  const guildId = interaction.guildId;

  const { data } = await validateLicense(guildId);

  if (!data || !data.valid) {
    return interaction.reply({
      content: '❌ This server is not licensed',
      ephemeral: true
    });
  }

  return next(interaction);
}
