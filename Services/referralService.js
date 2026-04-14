import { getGuildConfig, saveGuildConfig } from './guildConfig.js';

// =====================================================
// ENSURE REFERRAL STRUCTURE
// =====================================================
function ensure(config) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {}
    };
  }

  if (!config.referrals.codes) config.referrals.codes = {};
  if (!config.referrals.leaderboard) config.referrals.leaderboard = {};
  if (!config.referrals.usedServers) config.referrals.usedServers = {};
  if (!config.referrals.rewardsGiven) config.referrals.rewardsGiven = {};

  return config;
}

// =====================================================
// CREATE REFERRAL CODE
// =====================================================
export function createReferralCode(guildId, ownerId, code) {
  const config = ensure(getGuildConfig(guildId));

  config.referrals.codes[code] = {
    ownerId,
    uses: 0,
    usedBy: []
  };

  saveGuildConfig(guildId, config);

  return code;
}

// =====================================================
// REDEEM REFERRAL CODE (FIXED SIGNATURE)
// =====================================================
export function redeemReferralCode(guildId, code, serverId) {
  const config = ensure(getGuildConfig(guildId));

  const ref = config.referrals.codes?.[code];

  if (!ref) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  // prevent server reuse
  if (config.referrals.usedServers[serverId]) {
    return { ok: false, reason: 'SERVER_ALREADY_USED_CODE' };
  }

  // mark server used
  config.referrals.usedServers[serverId] = true;

  // update usage
  ref.usedBy.push(serverId);
  ref.uses += 1;

  // leaderboard update
  const ownerId = ref.ownerId;

  if (!config.referrals.leaderboard[ownerId]) {
    config.referrals.leaderboard[ownerId] = 0;
  }

  config.referrals.leaderboard[ownerId] += 1;

  const totalUses = config.referrals.leaderboard[ownerId];

  // =====================================================
  // REWARD TRACKING (ANTI-DUPLICATE)
  // =====================================================
  if (!config.referrals.rewardsGiven[ownerId]) {
    config.referrals.rewardsGiven[ownerId] = [];
  }

  const rewards = config.referrals.rewardsGiven[ownerId];

  let reward = null;

  if (totalUses >= 25 && !rewards.includes('lifetime')) {
    reward = 'lifetime';
    rewards.push('lifetime');
  } else if (totalUses >= 10 && !rewards.includes('month')) {
    reward = 'month';
    rewards.push('month');
  } else if (totalUses >= 5 && !rewards.includes('week')) {
    reward = 'week';
    rewards.push('week');
  }

  // apply reward
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
  }

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    ownerId,
    reward,
    totalUses
  };
}

// =====================================================
// GET LEADERBOARD
// =====================================================
export function getReferralLeaderboard(guildId, limit = 10) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
