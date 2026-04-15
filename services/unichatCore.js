import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { checkFraud } from '../services/antiFraudService.js';
import { applyReferralRole } from '../services/referralRoleService.js';

// =====================================================
// CACHE LAYER (PERFORMANCE BOOST)
// =====================================================
const configCache = new Map();

function getCachedConfig(guildId) {
  if (configCache.has(guildId)) {
    return configCache.get(guildId);
  }

  const config = getGuildConfig(guildId);
  configCache.set(guildId, config);
  return config;
}

function saveCachedConfig(guildId, config) {
  configCache.set(guildId, config);
  saveGuildConfig(guildId, config);
}

// =====================================================
// ENSURE SAFE STRUCTURE
// =====================================================
function ensure(config) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {}
    };
  }

  config.premium ||= false;
  config.mode ||= 'reaction';
  config.premiumStart ||= null;
  config.premiumExpiry ||= null;

  for (const code of Object.values(config.referrals.codes)) {
    if (!Array.isArray(code.usedBy)) code.usedBy = [];
    if (typeof code.uses !== 'number') code.uses = 0;
  }

  return config;
}

// =====================================================
// PREMIUM SYSTEM (STACKING + SAFE)
// =====================================================
function applyPremium(config, reward) {
  const now = Date.now();

  const durations = {
    week: 7 * 86400000,
    month: 30 * 86400000
  };

  config.premium = true;
  config.mode = 'auto';

  if (!config.premiumStart) {
    config.premiumStart = now;
  }

  // lifetime
  if (reward === 'lifetime') {
    config.premiumExpiry = null;
    return;
  }

  const extra = durations[reward];

  if (!config.premiumExpiry || config.premiumExpiry < now) {
    config.premiumExpiry = now + extra;
  } else {
    config.premiumExpiry += extra; // 🔥 STACKING
  }
}

// =====================================================
// MAIN REDEEM FUNCTION
// =====================================================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getCachedConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  // ensure safety
  if (!Array.isArray(ref.usedBy)) ref.usedBy = [];
  if (typeof ref.uses !== 'number') ref.uses = 0;

  // =========================
  // FRAUD CHECK (UPGRADED)
  // =========================
  const fraud = checkFraud({
    userId: member.id,
    ownerId: ref.ownerId,
    code,
    guildId: guild.id
  });

  if (!fraud.ok) return fraud;

  // =========================
  // ALREADY USED CHECK
  // =========================
  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = {
    code,
    usedAt: now
  };

  // =========================
  // UPDATE CODE
  // =========================
  ref.uses += 1;

  if (!ref.usedBy.includes(member.id)) {
    ref.usedBy.push(member.id);
  }

  // =========================
  // UPDATE LEADERBOARD
  // =========================
  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  // =========================
  // 🎁 REWARD SYSTEM
  // =========================
  let reward = null;

  if (total >= 25) reward = 'lifetime';
  else if (total >= 10) reward = 'month';
  else if (total >= 5) reward = 'week';

  if (reward) {
    applyPremium(config, reward);
  }

  // =========================
  // SAVE (CACHED)
  // =========================
  saveCachedConfig(guild.id, config);

  // =========================
  // APPLY ROLE (SAFE)
  // =========================
  await applyReferralRole(guild, member, total);

  return { ok: true, total, reward };
}

// =====================================================
// CREATE REFERRAL CODE
// =====================================================
export function createReferralCode(guildId, ownerId, code) {
  const config = ensure(getCachedConfig(guildId));

  config.referrals.codes[code] = {
    ownerId,
    uses: 0,
    usedBy: [],
    createdAt: Date.now()
  };

  saveCachedConfig(guildId, config);
  return code;
}

// =====================================================
// LEADERBOARD
// =====================================================
export function getLeaderboard(guildId) {
  const config = ensure(getCachedConfig(guildId));

  return Object.entries(config.referrals.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}
