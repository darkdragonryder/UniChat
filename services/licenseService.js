import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// ENSURE LICENSE STRUCTURE
// ===============================
function ensure(config) {
  if (!config.licenses) {
    config.licenses = {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    };
  }

  config.licenses.devKeys ||= [];
  config.licenses.lifetimeKeys ||= [];
  config.licenses.usedKeys ||= {};

  return config;
}

// ===============================
// GENERATE LICENSE KEY
// ===============================
export function generateLicenseKey(guildId, type) {
  const cleanType = (type || '').toLowerCase();

  if (!['dev', 'lifetime'].includes(cleanType)) {
    return { ok: false, reason: 'INVALID_TYPE' };
  }

  const config = ensure(getGuildConfig(guildId));

  const key =
    `${cleanType.toUpperCase()}-` +
    Math.random().toString(36).substring(2, 8).toUpperCase() +
    '-' +
    Date.now().toString(36).toUpperCase();

  if (cleanType === 'dev') {
    config.licenses.devKeys.push(key);
  }

  if (cleanType === 'lifetime') {
    config.licenses.lifetimeKeys.push(key);
  }

  saveGuildConfig(guildId, config);

  return { ok: true, key };
}

// ===============================
// VIEW KEYS (ADMIN ONLY)
// ===============================
export function getAllLicenseKeys(guildId) {
  const config = ensure(getGuildConfig(guildId));
  const licenses = config.licenses;

  return {
    devKeys: licenses.devKeys.map(k => ({
      key: k,
      used: !!licenses.usedKeys?.[k]
    })),

    lifetimeKeys: licenses.lifetimeKeys.map(k => ({
      key: k,
      used: !!licenses.usedKeys?.[k]
    }))
  };
}

// ===============================
// GET SINGLE STATUS
// ===============================
export function getKeyStatus(guildId, key) {
  const config = ensure(getGuildConfig(guildId));

  const used = config.licenses.usedKeys?.[key];

  if (!used) return { used: false };

  return {
    used: true,
    type: used.type,
    usedAt: used.usedAt,
    guildId: used.guildId
  };
}
