import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// =====================================================
// AUTO SYNC EXPIRED LICENSES (CONFIG CLEANUP)
// =====================================================
export function syncGuildLicenseExpiry(guildId) {
  const config = getGuildConfig(guildId);

  if (!config?.premium) return;

  if (
    config.premiumExpiry !== null &&
    Date.now() > config.premiumExpiry
  ) {
    config.premium = false;
    config.mode = 'expired';
    config.premiumExpiry = null;

    saveGuildConfig(guildId, config);

    console.log(`⏱ License expired for guild: ${guildId}`);
  }
}
