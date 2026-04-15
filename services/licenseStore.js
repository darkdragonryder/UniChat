 import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { getLicenseStore } from './licenseStore.js';

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
  if (store.usedKeys[key]) {
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

    return finalize(config, store);
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

    return finalize(config, store);
  }

  return { ok: false, reason: 'INVALID_KEY' };
}

// ===============================
// SAVE BOTH
// ===============================
function finalize(config, store) {
  const fs = require('fs');
  fs.writeFileSync('./data/licenses.json', JSON.stringify(store, null, 2));

  saveGuildConfig(config.guildId, config);

  return {
    ok: true,
    type: store.usedKeys ? 'activated' : 'unknown'
  };
}
