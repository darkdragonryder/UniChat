import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from './licenseStore.js';

// =====================================================
// OWNER CHECK
// =====================================================
export function isOwner(userId) {
  return userId === process.env.OWNER_ID;
}

// =====================================================
// PREMIUM CHECK
// =====================================================
export function isPremium(guildId) {
  const config = getGuildConfig(guildId);

  if (!config) return false;
  if (!config.premium) return false;

  const now = Date.now();

  if (config.premiumExpiry === null) return true;

  if (now >= config.premiumExpiry) {
    config.premium = false;
    config.premiumExpiry = null;
    config.mode = 'expired';

    saveGuildConfig(guildId, config);
    return false;
  }

  return true;
}

// =====================================================
// APPLY LICENSE KEY (FIXED LOGIC)
// =====================================================
export async function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);

  if (!config) return { ok: false, reason: 'NO_CONFIG' };

  const result = await validateKey(key);
  if (!result.valid) return result;

  const entry = result.entry;

  const type = (entry.type || '').toLowerCase().trim();

  const durationMap = {
    dev: 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    lifetime: null
  };

  // 🔥 STRICT RULE: DB first, fallback second, NO silent null fallback
  const days =
    entry.durationDays !== null && entry.durationDays !== undefined
      ? entry.durationDays
      : durationMap[type];

  const now = Date.now();

  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (days === null || type === 'lifetime') {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + days * 86400000;
  }

  await useKey(key, guildId, userId);

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type,
    days,
    expiry: config.premiumExpiry
  };
}

// =====================================================
// MANUAL PREMIUM
// =====================================================
export function enablePremium(guildId, durationMs = null) {
  const config = getGuildConfig(guildId);
  if (!config) return;

  const now = Date.now();

  config.premium = true;
  config.mode = 'manual';
  config.premiumStart = now;
  config.premiumExpiry = durationMs ? now + durationMs : null;

  saveGuildConfig(guildId, config);
}
