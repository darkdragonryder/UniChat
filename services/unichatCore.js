import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from './licenseStore.js';
import { checkFraud } from './fraudCheck.js';

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

  // lifetime
  if (config.premiumExpiry === null) return true;

  // expired
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
// APPLY LICENSE (FINAL)
// =====================================================
export async function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);
  if (!config) return { ok: false, reason: 'NO_CONFIG' };

  // ==============================
  // FRAUD CHECK
  // ==============================
  const fraud = checkFraud({
    userId,
    ownerId: process.env.OWNER_ID,
    code: key,
    guildId
  });

  if (!fraud.ok) {
    if (fraud.reason === 'LOCKED') {
      const seconds = fraud.until
        ? Math.ceil((fraud.until - Date.now()) / 1000)
        : null;

      return {
        ok: false,
        reason: seconds
          ? `⛔ You are temporarily locked. Try again in ${seconds}s`
          : `⛔ You are temporarily locked. Try again later`
      };
    }

    return {
      ok: false,
      reason: `❌ Blocked: ${fraud.reason}`
    };
  }

  // ==============================
  // VALIDATE KEY
  // ==============================
  const result = await validateKey(key);

  if (!result.ok) {
    return result;
  }

  const entry = result.data;

  const type = (entry.type || '').toLowerCase().trim();

  const durationMap = {
    dev: 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    lifetime: null
  };

  // ==============================
  // DETERMINE DURATION
  // ==============================
  const days =
    entry.durationDays !== null && entry.durationDays !== undefined
      ? entry.durationDays
      : durationMap[type];

  const now = Date.now();

  // ==============================
  // APPLY TO CONFIG
  // ==============================
  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (days === null || type === 'lifetime') {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + days * 86400000;
  }

  // ==============================
  // MARK KEY USED
  // ==============================
  await useKey(key, guildId, userId);

  // ==============================
  // SAVE CONFIG
  // ==============================
  saveGuildConfig(guildId, config);

  // ==============================
  // SUCCESS
  // ==============================
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
