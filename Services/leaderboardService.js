import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// 90 DAY CYCLE
// ===============================
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

// ===============================
// BADGE RULES
// ===============================
const BADGE_LEVELS = [
  { count: 5, name: '🥈 Trusted Referrer' },
  { count: 10, name: '🥇 Elite Referrer' },
  { count: 25, name: '💎 Referral King' },
  { count: 50, name: '👑 Legend Referrer' }
];

// ===============================
// ENSURE STRUCTURE
// ===============================
function ensureLeaderboard(config) {
  if (!config.referrals) config.referrals = {};

  if (!config.referrals.leaderboard) config.referrals.leaderboard = {};
  if (!config.referrals.cycleStart) config.referrals.cycleStart = Date.now();

  if (!config.referrals.badges) config.referrals.badges = {};

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
// UPDATE LEADERBOARD
// ===============================
export function updateLeaderboard(guildId) {
  let config = getGuildConfig(guildId);
  config = ensureLeaderboard(config);

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
  let config = getGuildConfig(guildId);
  config = ensureLeaderboard(config);

  if (!config.referrals.leaderboard[userId]) {
    config.referrals.leaderboard[userId] = 0;
  }

  config.referrals.leaderboard[userId] += 1;

  const count = config.referrals.leaderboard[userId];

  // 🔥 AUTO BADGE ASSIGNMENT
  config.referrals.badges[userId] = getBadge(count);

  saveGuildConfig(guildId, config);
  return count;
}

// ===============================
// GET TOP USER
// ===============================
export function getTopReferrer(guildId) {
  const config = getGuildConfig(guildId);
  config = ensureLeaderboard(config);

  const entries = Object.entries(config.referrals.leaderboard || {});
  if (!entries.length) return null;

  const sorted = entries.sort((a, b) => b[1] - a[1]);

  return {
    userId: sorted[0][0],
    count: sorted[0][1]
  };
}

// ===============================
// GET USER BADGE
// ===============================
export function getUserBadge(guildId, userId) {
  const config = getGuildConfig(guildId);
  return config.referrals?.badges?.[userId] || '🥉 Rookie';
}
