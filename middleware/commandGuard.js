import { getGuildConfig } from '../utils/guildConfig.js';
import { isGuildLicensed } from '../utils/licenseCheck.js';

export async function commandGuard(interaction, command) {
  try {
    // =========================
    // GLOBAL BYPASS (OWNER)
    // =========================
    if (interaction.user.id === process.env.OWNER_ID) {
      return { ok: true };
    }

    // =========================
    // LOAD GUILD CONFIG
    // =========================
    const config = getGuildConfig(interaction.guild.id);

    if (!config) {
      return {
        ok: false,
        reply: '❌ Guild config missing'
      };
    }

    // =========================
    // LICENSE CHECK
    // =========================
    if (!isGuildLicensed(config)) {
      return {
        ok: false,
        reply: '❌ This server is not licensed.'
      };
    }

    // =========================
    // PASS
    // =========================
    return {
      ok: true,
      config
    };

  } catch (err) {
    console.error('Middleware error:', err);

    return {
      ok: false,
      reply: '❌ Internal middleware error'
    };
  }
}
