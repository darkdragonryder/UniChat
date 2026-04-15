import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';
import { validateKey } from './services/licenseStore.js';

// =====================================================
// CORE STATE
// =====================================================
const OWNER_ID = process.env.OWNER_ID;

// =====================================================
// OWNER
// =====================================================
export function isOwner(userId) {
  return userId === OWNER_ID;
}

// =====================================================
// PREMIUM SYSTEM
// =====================================================
export function isPremium(guildId) {
  const config = getGuildConfig(guildId);

  if (!config?.premium) return false;
  if (!config.premiumExpiry) return true;

  return Date.now() < config.premiumExpiry;
}

// =====================================================
// ENABLE PREMIUM
// =====================================================
export function enablePremium(guildId, durationMs = 30 * 86400000) {
  const config = getGuildConfig(guildId);
  const now = Date.now();

  config.premium = true;
  config.mode = 'auto';
  config.premiumStart = now;
  config.premiumExpiry = now + durationMs;

  saveGuildConfig(guildId, config);
}

// =====================================================
// 🔑 LICENSE ACTIVATION (NEW - IMPORTANT)
// =====================================================
export function applyLicenseKey(guildId, userId, key) {
  const config = getGuildConfig(guildId);

  const result = validateKey(key);
  if (!result.valid) return result;

  const entry = result.entry;

  const now = Date.now();

  const durationMap = {
    'dev': 7,
    '7day': 7,
    '14day': 14,
    '30day': 30,
    'lifetime': null
  };

  const days = entry.durationDays || durationMap[entry.type];

  config.premium = true;
  config.mode = 'license';
  config.premiumStart = now;

  if (days === null || entry.type === 'lifetime') {
    config.premiumExpiry = null;
  } else {
    config.premiumExpiry = now + (days * 86400000);
  }

  // mark key as used
  entry.used = true;
  entry.usedBy = guildId;

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    type: entry.type,
    days
  };
}

// =====================================================
// 👥 REFERRAL REWARD (NEW)
// =====================================================
export function rewardReferralIfNeeded(config, referrerId) {
  if (!config?.referrals?.leaderboard) return config;

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

// =====================================================
// CONFIG HELPERS
// =====================================================
export function getConfig(guildId) {
  return getGuildConfig(guildId);
}

export function setConfig(guildId, config) {
  return saveGuildConfig(guildId, config);
}
