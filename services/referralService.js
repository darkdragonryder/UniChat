import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// =====================================================
// RUNTIME CACHE
// =====================================================
const recentActions = new Map();
const codeCooldown = new Map();

// =====================================================
// ENSURE STRUCTURE
// =====================================================
function ensure(config) {
  if (!config) config = {};

  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {}
    };
  }

  config.referrals.codes ||= {};
  config.referrals.leaderboard ||= {};
  config.referrals.usedServers ||= {};
  config.referrals.rewardsGiven ||= {};

  // PREMIUM SAFETY
  config.premium ??= false;
  config.mode ??= null;
  config.premiumStart ??= null;
  config.premiumExpiry ??= null;

  return config;
}

// =====================================================
// FRAUD DETECTION
// =====================================================
function detectFraud(guildId, userId, code, ref) {
  const now = Date.now();

  if (ref.ownerId === userId) {
    return { fraud: true, reason: 'SELF_REFERRAL' };
  }

  const actions = recentActions.get(userId) || [];
  const filtered = actions.filter(t => now - t < 10 * 60 * 1000);

  if (filtered.length >= 3) {
    return { fraud: true, reason: 'RATE_LIMIT' };
  }

  filtered.push(now);
  recentActions.set(userId, filtered);

  const lastUse = codeCooldown.get(code);
  if (lastUse && now - lastUse < 5000) {
    return { fraud: true, reason: 'CODE_SPAM' };
  }

  codeCooldown.set(code, now);

  const config = ensure(getGuildConfig(guildId));
  const usedCount = Object.keys(config.referrals.usedServers).length;

  if (usedCount > 10) {
    return { fraud: true, reason: 'SERVER_FARM_SUSPECTED' };
  }

  return { fraud: false };
}

// =====================================================
// CREATE REFERRAL CODE
// =====================================================
export function createReferralCode(guildId, ownerId, code) {
  const config = ensure(getGuildConfig(guildId));

  config.referrals.codes[code] = {
    ownerId,
    uses: 0,
    usedBy: [],
    createdAt: Date.now()
  };

  saveGuildConfig(guildId, config);
  return code;
}

// =====================================================
// REDEEM REFERRAL CODE
// =====================================================
export function redeemReferralCode(guildId, code, serverId) {
  const config = ensure(getGuildConfig(guildId));

  const ref = config.referrals.codes?.[code];

  if (!ref) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  const fraud = detectFraud(guildId, serverId, code, ref);
  if (fraud.fraud) {
    return { ok: false, reason: `FRAUD_BLOCKED_${fraud.reason}` };
  }

  if (config.referrals.usedServers[serverId]) {
    return { ok: false, reason: 'SERVER_ALREADY_USED_CODE' };
  }

  config.referrals.usedServers[serverId] = {
    code,
    usedAt: Date.now()
  };

  if (!ref.usedBy.includes(serverId)) {
    ref.usedBy.push(serverId);
    ref.uses += 1;
  }

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const totalUses = config.referrals.leaderboard[ownerId];

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

  if (reward) {
    const now = Date.now();

    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;

    if (reward === 'week') {
      config.premiumExpiry = now + 7 * 24 * 60 * 60 * 1000;
    } else if (reward === 'month') {
      config.premiumExpiry = now + 30 * 24 * 60 * 60 * 1000;
    } else if (reward === 'lifetime') {
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
// LEADERBOARD
// =====================================================
export function getReferralLeaderboard(guildId, limit = 10) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
