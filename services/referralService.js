import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { checkFraud } from './antiFraudService.js';
import { applyReferralRole } from './referralRoleService.js';

// =====================================================
// ENSURE STRUCTURE
// =====================================================
function ensure(config) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {}
    };
  }
  return config;
}

// =====================================================
// CREATE CODE
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
// REDEEM CODE (MAIN LOGIC)
// =====================================================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  // -------------------------
  // FRAUD CHECK
  // -------------------------
  const fraud = checkFraud({
    userId: member.id,
    ownerId: ref.ownerId,
    code
  });

  if (!fraud.ok) return fraud;

  // -------------------------
  // ALREADY USED CHECK
  // -------------------------
  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = {
    code,
    usedAt: now
  };

  // -------------------------
  // UPDATE STATS
  // -------------------------
  ref.uses += 1;

  if (!ref.usedBy.includes(member.id)) {
    ref.usedBy.push(member.id);
  }

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  // -------------------------
  // SAVE FIRST (IMPORTANT)
  // -------------------------
  saveGuildConfig(guild.id, config);

  // -------------------------
  // APPLY ROLE SYSTEM
  // -------------------------
  await applyReferralRole(guild, member, total);

  return {
    ok: true,
    total
  };
}

// =====================================================
// LEADERBOARD
// =====================================================
export function getReferralLeaderboard(guildId) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}
