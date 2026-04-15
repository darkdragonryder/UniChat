import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';
import { useKey, validateKey } from './services/licenseStore.js';

// =====================================================
// OWNER
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
  if (!config.premiumExpiry) return true;

  return Date.now() < config.premiumExpiry;
}

// =====================================================
// ENABLE PREMIUM (DIRECT)
// =====================================================
export function enablePremium(guildId, durationMs) {
  const config = getGuildConfig(guildId);
  const now = Date.now();

  config.premium = true;
  config.mode = 'manual';
  config.premiumStart = now;
  config.premiumExpiry = durationMs ? now + durationMs : null;

  saveGuildConfig(guildId, config);
}

// =====================================================
// 🔑 APPLY LICENSE KEY (CORE FLOW)
// =====================================================
export function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);

  const result = validateKey(key);
  if (!result.valid) return result;

  const entry = result.entry;

  const durationMap = {
    dev: 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    lifetime: null
  };

  const days = durationMap[entry.type] ?? entry.durationDays;

  const now = Date.now();

  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (!days || entry.type === 'lifetime') {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + days * 86400000;
  }

  // mark key used (IMPORTANT FIX)
  useKey(key, guildId);

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type: entry.type,
    days
  };
}

// =====================================================
// 👥 REFERRAL REWARD HOOK (NOW COMPLETE STRUCTURE)
// =====================================================
export function rewardReferral(config, referrerId) {
  if (!config?.referrals) return config;

  config.referrals.leaderboard ??= {};

  config.referrals.leaderboard[referrerId] =
    (config.referrals.leaderboard[referrerId] || 0) + 1;

  return config;
}

// =====================================================
// LEADERBOARD
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

// =====================================================
// CONFIG HELPERS
// =====================================================
export function getConfig(guildId) {
  return getGuildConfig(guildId);
}

export function setConfig(guildId, config) {
  return saveGuildConfig(guildId, config);
}
