import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { checkFraud } from '../services/antiFraudService.js';
import { applyReferralRole } from '../services/referralRoleService.js';

const OWNER_ID = process.env.OWNER_ID;

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

export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  const fraud = checkFraud({
    userId: member.id,
    ownerId: ref.ownerId,
    code
  });

  if (!fraud.ok) return fraud;

  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = { code, usedAt: now };

  ref.uses++;
  ref.usedBy.push(member.id);

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  saveGuildConfig(guild.id, config);

  await applyReferralRole(guild, member, total);

  return { ok: true, total };
}
