import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ===============================
// CACHE (ANTI SPAM)
// ===============================
const recentActions = new Map();
const codeCooldown = new Map();

// ===============================
// ROLE TIERS
// ===============================
const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer' },
  { count: 10, name: '🥈 Trusted Referrer' },
  { count: 25, name: '🥇 Elite Referrer' },
  { count: 50, name: '👑 Legend Referrer' }
];

// ===============================
// ENSURE CONFIG
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
  return config;
}

// ===============================
// GET TIER
// ===============================
function getTier(count) {
  return [...ROLE_TIERS].reverse().find(t => count >= t.count);
}

// ===============================
// CREATE ROLE IF MISSING
// ===============================
async function getOrCreateRole(guild, name) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: 0xFFD700,
      reason: 'Referral system'
    });
  }

  return role;
}

// ===============================
// UPDATE ROLE
// ===============================
async function updateRole(guild, member, count) {
  const tier = getTier(count);
  if (!tier) return;

  const role = await getOrCreateRole(guild, tier.name);

  for (const t of ROLE_TIERS) {
    const r = guild.roles.cache.find(x => x.name === t.name);
    if (r && member.roles.cache.has(r.id) && r.id !== role.id) {
      await member.roles.remove(r).catch(() => {});
    }
  }

  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}

// ===============================
// REDEEM CODE (MAIN FUNCTION)
// ===============================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  // SELF REFERRAL CHECK
  if (ref.ownerId === member.id) {
    return { ok: false, reason: 'SELF_USE' };
  }

  // RATE LIMIT
  const actions = recentActions.get(member.id) || [];
  if (actions.filter(t => now - t < 600000).length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }
  actions.push(now);
  recentActions.set(member.id, actions);

  // ALREADY USED SERVER
  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = { code, usedAt: now };

  // UPDATE CODE
  ref.uses++;
  ref.usedBy.push(member.id);

  // UPDATE LEADERBOARD
  const ownerId = ref.ownerId;
  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  // PREMIUM REWARDS
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

  await updateRole(guild, member, total);

  return { ok: true, reward, total };
}

// ===============================
// LEADERBOARD
// ===============================
export function getLeaderboard(guildId) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard)
    .sort((a, b) => b[1] - a[1]);
}
