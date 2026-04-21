import { getGuildConfig } from '../utils/guildConfig.js';
import { isGuildLicensed } from '../utils/licenseCheck.js';

// ==============================
// GLOBAL COMMAND MIDDLEWARE
// ==============================
export async function commandGuard(interaction, command) {
  try {

    const guildId = interaction.guild?.id;
    const userId = interaction.user.id;

    // ==============================
    // OWNER BYPASS
    // ==============================
    if (userId === process.env.OWNER_ID) {
      return {
        ok: true,
        role: 'owner'
      };
    }

    // ==============================
    // SAFETY CHECK (DM BLOCK)
    // ==============================
    if (!guildId) {
      return {
        ok: false,
        reply: '❌ Commands can only be used in servers.'
      };
    }

    // ==============================
    // LOAD GUILD CONFIG
    // ==============================
    const config = getGuildConfig(guildId);

    if (!config) {
      return {
        ok: false,
        reply: '❌ Guild config not found.'
      };
    }

    // ==============================
    // LICENSE CHECK (GLOBAL ENFORCEMENT)
    // ==============================
    if (!isGuildLicensed(config)) {
      return {
        ok: false,
        reply: '❌ This server is not licensed.'
      };
    }

    // ==============================
    // SUCCESS
    // ==============================
    return {
      ok: true,
      config,
      role: 'user'
    };

  } catch (err) {
    console.error('❌ Middleware crash:', err);

    return {
      ok: false,
      reply: '❌ Internal system error.'
    };
  }
}
