import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// RUNTIME CACHE
// ===============================
const recentActions = new Map();
const codeCooldown = new Map();

// ===============================
// ENSURE STRUCTURE
// ===============================
function ensure(config) {
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

  return config;
}

// ===============================
// FRAUD CHECK
// ===============================
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

// ===============================
// CREATE CODE
// ===============================
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

// ===============================
// REDEEM CODE
// ===============================
export function redeemReferralCode(guildId, userId, code) {
  const config = ensure(getGuildConfig(guildId));

  const ref = config.referrals.codes?.[code];

  if (!ref) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  const fraud = detectFraud(guildId, userId, code, ref);
  if (fraud.fraud) {
    return { ok: false, reason: `FRAUD_BLOCKED_${fraud.reason}` };
  }

  if (config.referrals.usedServers[userId]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[userId] = {
    code,
    usedAt: Date.now()
  };

  if (!ref.usedBy.includes(userId)) {
    ref.usedBy.push(userId);
    ref.uses++;
  }

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  saveGuildConfig(guildId, config);

  return {
    ok: true,
    ownerId,
    totalUses: config.referrals.leaderboard[ownerId]
  };
}

// ===============================
// LEADERBOARD
// ===============================
export function getReferralLeaderboard(guildId, limit = 10) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
