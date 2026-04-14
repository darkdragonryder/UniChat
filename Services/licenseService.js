import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// APPLY LICENSE
// ===============================
export function activateLicense(guildId, key) {
  const config = getGuildConfig(guildId);

  if (!config.licenses) {
    return { ok: false, reason: 'LICENSE_SYSTEM_MISSING' };
  }

  const { devKeys, lifetimeKeys, usedKeys } = config.licenses;

  // ===============================
  // CHECK IF ALREADY USED
  // ===============================
  if (usedKeys[key]) {
    return { ok: false, reason: 'KEY_ALREADY_USED' };
  }

  const now = Date.now();

  // ===============================
  // DEV KEY (FULL CONTROL)
  // ===============================
  if (devKeys.includes(key)) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;

    usedKeys[key] = {
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

    usedKeys[key] = {
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
// ADD KEYS (ADMIN ONLY USE)
// ===============================
export function addLicenseKey(guildId, type, key) {
  const config = getGuildConfig(guildId);

  if (!config.licenses) {
    config.licenses = { devKeys: [], lifetimeKeys: [], usedKeys: {} };
  }

  if (type === 'dev') {
    config.licenses.devKeys.push(key);
  }

  if (type === 'lifetime') {
    config.licenses.lifetimeKeys.push(key);
  }

  saveGuildConfig(guildId, config);

  return { ok: true };
}
