import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// APPLY LICENSE
// ===============================
export function activateLicense(guildId, key) {
  const config = getGuildConfig(guildId);

  // ===============================
  // ENSURE LICENSE STRUCTURE SAFETY
  // ===============================
  if (!config.licenses) {
    config.licenses = {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    };
  }

  const devKeys = config.licenses.devKeys || [];
  const lifetimeKeys = config.licenses.lifetimeKeys || [];
  const usedKeys = config.licenses.usedKeys || {};

  // ===============================
  // CHECK IF ALREADY USED
  // ===============================
  if (usedKeys[key]) {
    return { ok: false, reason: 'KEY_ALREADY_USED' };
  }

  const now = Date.now();

  // ===============================
  // DEV KEY (FULL ACCESS)
  // ===============================
  if (devKeys.includes(key)) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;

    config.licenses.usedKeys[key] = {
      type: 'dev',
      usedAt: now,
      guildId
    };

    saveGuildConfig(guildId, config);

    return {
      ok: true,
      type: 'dev',
      message: 'Developer license activated (FULL ACCESS)'
    };
  }

  // ===============================
  // LIFETIME KEY
  // ===============================
  if (lifetimeKeys.includes(key)) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;

    config.licenses.usedKeys[key] = {
      type: 'lifetime',
      usedAt: now,
      guildId
    };

    saveGuildConfig(guildId, config);

    return {
      ok: true,
      type: 'lifetime',
      message: 'Lifetime license activated'
    };
  }

  // ===============================
  // INVALID KEY
  // ===============================
  return { ok: false, reason: 'INVALID_KEY' };
}

// ===============================
// ADD KEYS (ADMIN TOOLING)
// ===============================
export function addLicenseKey(guildId, type, key) {
  const config = getGuildConfig(guildId);

  if (!config.licenses) {
    config.licenses = {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    };
  }

  if (type === 'dev') {
    if (!config.licenses.devKeys.includes(key)) {
      config.licenses.devKeys.push(key);
    }
  }

  if (type === 'lifetime') {
    if (!config.licenses.lifetimeKeys.includes(key)) {
      config.licenses.lifetimeKeys.push(key);
    }
  }

  saveGuildConfig(guildId, config);

  return { ok: true };
}
