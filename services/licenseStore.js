import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { getLicenseStore, saveLicenseStore } from './licenseStore.js';

// ===============================
// ACTIVATE LICENSE
// ===============================
export function activateLicense(guildId, key, userId) {
  const config = getGuildConfig(guildId);
  const store = getLicenseStore();

  const now = Date.now();

  // ===============================
  // ALREADY USED (GLOBAL CHECK)
  // ===============================
  if (store.usedKeys?.[key]) {
    return { ok: false, reason: 'KEY_ALREADY_USED' };
  }

  // ===============================
  // DEV KEY
  // ===============================
  if (store.devKeys.includes(key)) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;

    store.usedKeys[key] = {
      type: 'dev',
      usedAt: now,
      guildId,
      userId
    };

    return finalize(guildId, config, store);
  }

  // ===============================
  // LIFETIME KEY
  // ===============================
  if (store.lifetimeKeys.includes(key)) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;

    store.usedKeys[key] = {
      type: 'lifetime',
      usedAt: now,
      guildId,
      userId
    };

    return finalize(guildId, config, store);
  }

  return { ok: false, reason: 'INVALID_KEY' };
}

// ===============================
// FINALIZE SAVE (SINGLE SOURCE OF TRUTH)
// ===============================
function finalize(guildId, config, store) {
  // save global license store (NO fs manual writes)
  saveLicenseStore(store);

  // save guild config properly
  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type: config.premium ? 'activated' : 'unknown'
  };
}
