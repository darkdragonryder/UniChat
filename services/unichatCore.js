import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from './licenseStore.js';

// ==============================
// APPLY LICENSE KEY (FIXED)
// ==============================
export async function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);

  if (!config) return { ok: false, reason: 'NO_CONFIG' };

  const result = await validateKey(key);
  if (!result.valid) return result;

  const entry = result.entry;

  const cleanType = (entry.type || '').toLowerCase().trim();

  const durationMap = {
    dev: 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    lifetime: null
  };

  const days =
    entry.durationDays ??
    durationMap[cleanType] ??
    null;

  const now = Date.now();

  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (!days || cleanType === 'lifetime') {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + days * 86400000;
  }

  await useKey(key, guildId, userId);

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type: cleanType,
    days,
    expiry: config.premiumExpiry
  };
}
