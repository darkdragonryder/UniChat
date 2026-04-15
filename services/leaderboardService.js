import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// 90 DAY CYCLE
// ===============================
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

// ===============================
// BADGE LEVELS
// ===============================
const BADGE_LEVELS = [
  { count: 5, name: '🥈 Trusted Referrer' },
  { count: 10, name: '🥇 Elite Referrer' },
  { count: 25, name: '💎 Referral King' },
  { count: 50, name: '👑 Legend Referrer' }
];

// ===============================
// ENSURE STRUCTURE (SAFE GLOBAL ALIGNMENT)
// ===============================
function ensureLeaderboard(config) {
  if (!config) return config;

  if (!config.referrals) {
    config.referrals = {
      leaderboard: {},
      badges: {},
      cycleStart: Date.now(),

      // compatibility with other services
      codes: {},
      usedServers: {},
      rewardsGiven: {}
    };
  }

  config.referrals.leaderboard ||= {};
  config.referrals.badges ||= {};
  config.referrals.codes ||= {};
  config.referrals.usedServers ||= {};
  config.referrals.rewardsGiven ||= {};

  config.referrals.cycleStart ||= Date.now();

  return config;
}

// ===============================
// BADGE CALCULATOR
// ===============================
function getBadge(count) {
  let badge = '🥉 Rookie';

  for (const level of BADGE_LEVELS) {
    if (count >= level.count) {
      badge = level.name;
    }
  }

  return badge;
}

// ===============================
// UPDATE LEADERBOARD (90 DAY RESET)
// ===============================
export function updateLeaderboard(guildId) {
  const raw = getGuildConfig(guildId);
  const config = ensureLeaderboard(raw);

  if (!config) return null;

  const now = Date.now();

  if (now - config.referrals.cycleStart > NINETY_DAYS) {
    config.referrals.leaderboard = {};
    config.referrals.badges = {};
    config.referrals.cycleStart = now;
  }

  saveGuildConfig(guildId, config);
  return config;
}

// ===============================
// ADD REFERRAL POINT
// ===============================
export function addReferralPoint(guildId, userId) {
  const config = ensureLeaderboard(getGuildConfig(guildId));
  if (!config) return 0;

  config.referrals.leaderboard[userId] =
    (config.referrals.leaderboard[userId] || 0) + 1;

  const count = config.referrals.leaderboard[userId];

  config.referrals.badges[userId] = getBadge(count);

  saveGuildConfig(guildId, config);

  return count;
}

// ===============================
// GET TOP USER
// ===============================
export function getTopReferrer(guildId) {
  const config = ensureLeaderboard(getGuildConfig(guildId));
  if (!config) return null;

  const entries = Object.entries(config.referrals.leaderboard);

  if (!entries.length) return null;

  entries.sort((a, b) => b[1] - a[1]);

  return {
    userId: entries[0][0],
    count: entries[0][1]
  };
}

// ===============================
// GET USER BADGE
// ===============================
export function getUserBadge(guildId, userId) {
  const config = ensureLeaderboard(getGuildConfig(guildId));
  if (!config) return '🥉 Rookie';

  return config.referrals.badges?.[userId] || '🥉 Rookie';
}
