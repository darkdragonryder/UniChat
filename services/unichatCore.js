import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from './licenseStore.js';
import { checkFraud } from './fraudCheck.js';

// ==============================
// APPLY LICENSE KEY (HARDENED)
// ==============================
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
    return { ok: false, reason: fraud.reason };
  }

  // ==============================
  // VALIDATE KEY
  // ==============================
  const result = await validateKey(key);
  if (!result.ok) return result;

  const entry = result.entry;

  const type = (entry.type || '').toLowerCase().trim();

  const durationMap = {
    dev: 7,
    '7day': 7,
    '30day': 30,
    lifetime: null
  };

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
