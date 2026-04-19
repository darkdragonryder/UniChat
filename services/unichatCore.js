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

  if (!config?.premium) return false;

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
// APPLY LICENSE KEY (HARDENED + FIXED)
// =====================================================
export async function applyLicenseKey(guildId, userId, key) {
  try {
    const config = getGuildConfig(guildId);
    if (!config) return { ok: false, error: 'NO_CONFIG' };

    // =========================
    // VALIDATE KEY (NEW FORMAT)
    // =========================
    const result = await validateKey(key);

    if (!result.ok) {
      return { ok: false, error: 'INVALID_KEY' };
    }

    const entry = result.data;

    // =========================
    // SAFETY CHECKS
    // =========================
    if (entry.used) {
      return { ok: false, error: 'ALREADY_USED' };
    }

    if (
      entry.expiresAt !== null &&
      Date.now() > entry.expiresAt
    ) {
      return { ok: false, error: 'EXPIRED' };
    }

    // =========================
    // DURATION LOGIC
    // =========================
    const type = (entry.type || '').toLowerCase().trim();

    const durationMap = {
      dev: 7,
      '7day': 7,
      '14day': 14,
      '30day': 30,
      lifetime: null
    };

    const days =
      entry.durationDays !== null && entry.durationDays !== undefined
        ? entry.durationDays
        : durationMap[type];

    const now = Date.now();

    // =========================
    // APPLY TO GUILD CONFIG
    // =========================
    config.premium = true;
    config.mode = 'license';
    config.premiumStart = now;

    if (days === null || type === 'lifetime') {
      config.premiumExpiry = null;
    } else {
      config.premiumExpiry = now + days * 86400000;
    }

    // =========================
    // MARK KEY AS USED (DB SAFE)
    // =========================
    const use = await useKey(key, guildId, userId);
    if (!use) {
      return { ok: false, error: 'FAILED_TO_MARK_USED' };
    }

    saveGuildConfig(guildId, config);

    return {
      ok: true,
      type,
      days,
      expiry: config.premiumExpiry
    };

  } catch (err) {
    console.log('applyLicenseKey crash:', err);
    return { ok: false, error: 'INTERNAL_ERROR' };
  }
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
