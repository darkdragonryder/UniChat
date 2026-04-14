import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// 90 DAY CYCLE
// ===============================
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

// ===============================
// ENSURE STRUCTURE
// ===============================
function ensureLeaderboard(config) {
  if (!config.referrals) config.referrals = {};
  if (!config.referrals.leaderboard) config.referrals.leaderboard = {};
  if (!config.referrals.cycleStart) {
    config.referrals.cycleStart = Date.now();
  }
  return config;
}

// ===============================
// UPDATE LEADERBOARD
// ===============================
export function updateLeaderboard(guildId) {
  let config = getGuildConfig(guildId);
  config = ensureLeaderboard(config);

  const now = Date.now();

  // reset cycle
  if (now - config.referrals.cycleStart > NINETY_DAYS) {
    config.referrals.leaderboard = {};
    config.referrals.cycleStart = now;
  }

  saveGuildConfig(guildId, config);
  return config;
}

// ===============================
// ADD INVITE / REFERRAL POINT
// ===============================
export function addReferralPoint(guildId, userId) {
  let config = getGuildConfig(guildId);
  config = ensureLeaderboard(config);

  if (!config.referrals.leaderboard[userId]) {
    config.referrals.leaderboard[userId] = 0;
  }

  config.referrals.leaderboard[userId] += 1;

  saveGuildConfig(guildId, config);
  return config.referrals.leaderboard[userId];
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
