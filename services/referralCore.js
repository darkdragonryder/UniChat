import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';
import { updateReferralRole } from './referralRoles.js';

const recentActions = new Map();

function ensure(config) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {}
    };
  }
  return config;
}

function detectFraud(memberId, codeData) {
  const now = Date.now();

  if (codeData.ownerId === memberId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  const actions = recentActions.get(memberId) || [];
  const filtered = actions.filter(t => now - t < 10 * 60 * 1000);

  if (filtered.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  filtered.push(now);
  recentActions.set(memberId, filtered);

  return { ok: true };
}

export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  const fraud = detectFraud(member.id, ref);
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

  let reward = null;

  if (total >= 25) reward = 'lifetime';
  else if (total >= 10) reward = 'month';
  else if (total >= 5) reward = 'week';

  if (reward) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;

    if (reward === 'week') config.premiumExpiry = now + 7 * 86400000;
    if (reward === 'month') config.premiumExpiry = now + 30 * 86400000;
    if (reward === 'lifetime') config.premiumExpiry = null;
  }

  saveGuildConfig(guild.id, config);

  await updateReferralRole(guild, member, total);

  return { ok: true, reward, total };
}

export function getLeaderboard(guildId) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard)
    .sort((a, b) => b[1] - a[1]);
}
