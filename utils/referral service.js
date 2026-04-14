import { getGuildConfig, saveGuildConfig } from './guildConfig.js';

// =====================================================
// CREATE REFERRAL CODE
// =====================================================
export function createReferralCode(guildId, ownerId, code) {
  const config = getGuildConfig(guildId);

  if (!config.referrals.codes) {
    config.referrals.codes = {};
  }

  config.referrals.codes[code] = {
    ownerId,
    uses: 0,
    usedBy: []
  };

  saveGuildConfig(guildId, config);

  return code;
}

// =====================================================
// REDEEM REFERRAL CODE
// =====================================================
export function redeemReferralCode(guildId, userId, code) {
  const config = getGuildConfig(guildId);

  const ref = config.referrals.codes?.[code];
  if (!ref) {
    return { success: false, reason: 'INVALID_CODE' };
  }

  // prevent self-use
  if (ref.ownerId === userId) {
    return { success: false, reason: 'SELF_USE' };
  }

  // prevent double use
  if (ref.usedBy.includes(userId)) {
    return { success: false, reason: 'ALREADY_USED' };
  }

  // mark used
  ref.usedBy.push(userId);
  ref.uses += 1;

  // leaderboard update
  if (!config.referrals.leaderboard[ref.ownerId]) {
    config.referrals.leaderboard[ref.ownerId] = 0;
  }

  config.referrals.leaderboard[ref.ownerId] += 1;

  // reward logic
  const total = config.referrals.leaderboard[ref.ownerId];

  let reward = null;

  if (total === 5) reward = 'week';
  if (total === 10) reward = 'month';
  if (total === 25) reward = 'lifetime';

  let rewardResult = null;

  if (reward) {
    const now = Date.now();

    if (reward === 'week') {
      config.premium = true;
      config.mode = 'auto';
      config.premiumStart = now;
      config.premiumExpiry = now + 7 * 24 * 60 * 60 * 1000;
    }

    if (reward === 'month') {
      config.premium = true;
      config.mode = 'auto';
      config.premiumStart = now;
      config.premiumExpiry = now + 30 * 24 * 60 * 60 * 1000;
    }

    if (reward === 'lifetime') {
      config.premium = true;
      config.mode = 'auto';
      config.premiumStart = now;
      config.premiumExpiry = null;
    }

    rewardResult = reward;
  }

  saveGuildConfig(guildId, config);

  return {
    success: true,
    ownerId: ref.ownerId,
    reward: rewardResult,
    totalUses: total
  };
}

// =====================================================
// GET LEADERBOARD
// =====================================================
export function getReferralLeaderboard(guildId, limit = 10) {
  const config = getGuildConfig(guildId);

  const lb = config.referrals.leaderboard || {};

  return Object.entries(lb)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
