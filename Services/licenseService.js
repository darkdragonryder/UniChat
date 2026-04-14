import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// GENERATE LICENSE KEY
// ===============================
export function generateLicenseKey(guildId, type) {
  const config = getGuildConfig(guildId);

  if (!config.licenses) {
    config.licenses = {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    };
  }

  const key =
    type.toUpperCase() +
    '-' +
    Math.random().toString(36).substring(2, 8).toUpperCase() +
    '-' +
    Date.now().toString(36).toUpperCase();

  if (type === 'dev') {
    config.licenses.devKeys.push(key);
  }

  if (type === 'lifetime') {
    config.licenses.lifetimeKeys.push(key);
  }

  saveGuildConfig(guildId, config);

  return key;
}

// ===============================
// VIEW KEYS (ADMIN ONLY)
// ===============================
export function getAllLicenseKeys(guildId) {
  const config = getGuildConfig(guildId);

  const licenses = config.licenses || {
    devKeys: [],
    lifetimeKeys: [],
    usedKeys: {}
  };

  return {
    devKeys: licenses.devKeys.map(k => ({
      key: k,
      used: !!licenses.usedKeys[k]
    })),

    lifetimeKeys: licenses.lifetimeKeys.map(k => ({
      key: k,
      used: !!licenses.usedKeys[k]
    }))
  };
}

// ===============================
// GET SINGLE STATUS
// ===============================
export function getKeyStatus(guildId, key) {
  const config = getGuildConfig(guildId);

  const used = config.licenses?.usedKeys?.[key];

  if (!used) return { used: false };

  return {
    used: true,
    type: used.type,
    usedAt: used.usedAt,
    guildId: used.guildId
  };
}
