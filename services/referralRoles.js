import { getGuildConfig } from '../utils/guildConfig.js';

// ===============================
// ROLE TIERS (single source of truth)
// ===============================
const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 10, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 25, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// ===============================
// GET BEST ROLE TIER
// ===============================
function getTier(count) {
  return [...ROLE_TIERS]
    .reverse()
    .find(t => count >= t.count) || null;
}

// ===============================
// GET OR CREATE ROLE (SAFE)
// ===============================
async function getOrCreateRole(guild, tier) {
  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    role = await guild.roles.create({
      name: tier.name,
      color: tier.color,
      reason: 'Referral system auto role'
    });
  }

  return role;
}

// ===============================
// MAIN EXPORT: UPDATE USER ROLE
// ===============================
export async function updateReferralRole(guild, member, referralCount) {
  if (!guild || !member) return;

  const config = getGuildConfig(guild.id);

  // safety toggle (you already have this in config)
  if (!config?.referralRoles?.enabled) return;

  const tier = getTier(referralCount);
  if (!tier) return;

  const targetRole = await getOrCreateRole(guild, tier);

  // ===============================
  // REMOVE OLD REFERRAL ROLES
  // ===============================
  const oldRoles = ROLE_TIERS
    .map(t => guild.roles.cache.find(r => r.name === t.name))
    .filter(Boolean);

  for (const role of oldRoles) {
    if (role.id !== targetRole.id && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => {});
    }
  }

  // ===============================
  // APPLY NEW ROLE
  // ===============================
  if (!member.roles.cache.has(targetRole.id)) {
    await member.roles.add(targetRole).catch(() => {});
  }
}

// ===============================
// OPTIONAL: BULK SYNC (SAFE REFRESH)
// ===============================
export async function syncAllReferralRoles(guild, leaderboard = {}) {
  try {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;

    for (const member of members.values()) {
      const count = leaderboard[member.id] || 0;
      if (count <= 0) continue;

      await updateReferralRole(guild, member, count);
    }
  } catch (err) {
    console.log('Referral sync error:', err);
  }
}
