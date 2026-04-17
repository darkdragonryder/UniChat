import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { validateKey, useKey } from './licenseStore.js';

// =====================================================
// OWNER CHECK
// =====================================================
export function isOwner(userId) {
  return userId === process.env.OWNER_ID;
}

// =====================================================
// PREMIUM CHECK (READ ONLY)
// =====================================================
export function isPremium(guildId) {
  const config = getGuildConfig(guildId);

  if (!config?.premium) return false;

  // lifetime check
  if (config.premiumExpiry === null) return true;

  return Date.now() < config.premiumExpiry;
}

// =====================================================
// MANUAL PREMIUM OVERRIDE
// =====================================================
export function enablePremium(guildId, durationMs = null) {
  const config = getGuildConfig(guildId);

  const now = Date.now();

  config.premium = true;
  config.mode = 'manual';
  config.premiumStart = now;
  config.premiumExpiry = durationMs ? now + durationMs : null;

  saveGuildConfig(guildId, config);
}

// =====================================================
// APPLY LICENSE KEY (SOURCE OF TRUTH)
// =====================================================
export async function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);

  // IMPORTANT: support async validation
  const result = await validateKey(key);

  if (!result.valid) return result;

  const entry = result.entry;

  const durationMap = {
    dev: 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    lifetime: null
  };

  const days = entry.durationDays ?? durationMap[entry.type];

  const now = Date.now();

  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (entry.type === 'lifetime' || !days) {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + days * 86400000;
  }

  // IMPORTANT: only ONE place marks key as used
  await useKey(key, guildId, userId);

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type: entry.type,
    days
  };
}

// =====================================================
// REFERRAL SYSTEM (UNCHANGED SAFE LOGIC)
// =====================================================
export function rewardReferral(config, referrerId) {
  config.referrals ??= { leaderboard: {} };
  config.referrals.leaderboard ??= {};

  config.referrals.leaderboard[referrerId] =
    (config.referrals.leaderboard[referrerId] || 0) + 1;

  return config;
}

// =====================================================
// LEADERBOARD HELPERS
// =====================================================
export function getLeaderboard(guildId) {
  const config = getGuildConfig(guildId);

  return Object.entries(config?.referrals?.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}

export function getTopReferrer(guildId) {
  const lb = getLeaderboard(guildId);

  if (!lb.length) return null;

  return {
    userId: lb[0][0],
    count: lb[0][1]
  };
}
