import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { checkFraud } from '../services/antiFraudService.js';
import { applyReferralRole } from '../services/referralRoleService.js';

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

  // safety guards (prevents crashes)
  for (const code of Object.values(config.referrals.codes)) {
    if (!Array.isArray(code.usedBy)) code.usedBy = [];
    if (typeof code.uses !== 'number') code.uses = 0;
  }

  return config;
}

// =====================================================
// MAIN REDEEM FUNCTION
// =====================================================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  // ensure safe structure
  if (!Array.isArray(ref.usedBy)) ref.usedBy = [];
  if (typeof ref.uses !== 'number') ref.uses = 0;

  // =========================
  // FRAUD CHECK
  // =========================
  const fraud = checkFraud({
    userId: member.id,
    ownerId: ref.ownerId,
    code
  });

  if (!fraud.ok) return fraud;

  // =========================
  // SERVER ALREADY USED CHECK
  // =========================
  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = {
    code,
    usedAt: now
  };

  // =========================
  // UPDATE CODE STATS
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
  // SAVE FIRST (SAFE POINT)
  // =========================
  saveGuildConfig(guild.id, config);

  // =========================
  // APPLY ROLE
  // =========================
  await applyReferralRole(guild, member, total);

  return { ok: true, total };
}
