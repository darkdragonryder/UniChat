import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// =====================================================
// RUNTIME CACHE
// =====================================================
const recentActions = new Map();
const codeCooldown = new Map();

// =====================================================
// ROLE TIERS (single source of truth)
// =====================================================
const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 10, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 25, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// =====================================================
// ENSURE STRUCTURE
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

  config.premium ||= false;
  config.mode ||= 'reaction';
  config.premiumStart ||= null;
  config.premiumExpiry ||= null;

  return config;
}

// =====================================================
// FRAUD DETECTION
// =====================================================
function detectFraud(memberId, codeData, code) {
  const now = Date.now();

  // self use
  if (codeData.ownerId === memberId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  // rate limit
  const actions = recentActions.get(memberId) || [];
  const filtered = actions.filter(t => now - t < 10 * 60 * 1000);

  if (filtered.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  filtered.push(now);
  recentActions.set(memberId, filtered);

  // spam protection
  const last = codeCooldown.get(code);
  if (last && now - last < 5000) {
    return { ok: false, reason: 'CODE_SPAM' };
  }

  codeCooldown.set(code, now);

  return { ok: true };
}

// =====================================================
// ROLE HANDLER (INLINE, NO EXTRA FILE NEEDED)
// =====================================================
async function applyRole(guild, member, count) {
  const tier =
    [...ROLE_TIERS].reverse().find(t => count >= t.count);

  if (!tier) return;

  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    role = await guild.roles.create({
      name: tier.name,
      color: tier.color,
      reason: 'Unified referral system'
    });
  }

  // remove old roles
  for (const t of ROLE_TIERS) {
    const r = guild.roles.cache.find(x => x.name === t.name);
    if (r && member.roles.cache.has(r.id) && r.id !== role.id) {
      await member.roles.remove(r).catch(() => {});
    }
  }

  // add new role
  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}

// =====================================================
// MAIN: REDEEM REFERRAL CODE
// =====================================================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  const fraud = detectFraud(member.id, ref, code);
  if (!fraud.ok) return fraud;

  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = {
    code,
    usedAt: now
  };

  ref.uses++;
  ref.usedBy.push(member.id);

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  // =====================================================
  // PREMIUM REWARDS
  // =====================================================
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

  // role update for USER (not owner)
  await applyRole(guild, member, total);

  return { ok: true, reward, total };
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
// LEADERBOARD
// =====================================================
export function getLeaderboard(guildId) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}

// =====================================================
// TOP USER
// =====================================================
export function getTopReferrer(guildId) {
  const lb = getLeaderboard(guildId);
  if (!lb.length) return null;

  return {
    userId: lb[0][0],
    count: lb[0][1]
  };
}
