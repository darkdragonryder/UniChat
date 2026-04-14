import { getGuildConfig } from '../utils/guildConfig.js';

const ROLE_TIERS = [
  { count: 1, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 5, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 10, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 25, name: '💎 Referral King', color: 0x9b59b6 },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// ===============================
// GET ROLE TIER
// ===============================
function getRoleTier(count) {
  let role = ROLE_TIERS[0];

  for (const tier of ROLE_TIERS) {
    if (count >= tier.count) role = tier;
  }

  return role;
}

// ===============================
// GET LEADERBOARD
// ===============================
function getLeaderboard(config) {
  return config?.referrals?.leaderboard || {};
}

// ===============================
// GET OR CREATE ROLE (SAFE)
// ===============================
async function getOrCreateRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: 'Referral system role'
    });
  }

  return role;
}

// ===============================
// MAIN ROLE SYNC (FIXED)
// ===============================
export async function updateReferralRole(guild, leaderboard = null) {
  try {
    const config = getGuildConfig(guild.id);
    const lb = leaderboard || getLeaderboard(config);

    const members = await guild.members.fetch();

    // cache roles to avoid repeated creation
    const roleCache = new Map();

    for (const [userId, count] of Object.entries(lb)) {

      const member = members.get(userId) || await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      const tier = getRoleTier(count);

      let role = roleCache.get(tier.name);

      if (!role) {
        role = await getOrCreateRole(guild, tier.name, tier.color);
        roleCache.set(tier.name, role);
      }

      // ===============================
      // REMOVE OLD REFERRAL ROLES
      // ===============================
      for (const t of ROLE_TIERS) {
        const r = guild.roles.cache.find(x => x.name === t.name);
        if (r && member.roles.cache.has(r.id)) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      // ===============================
      // APPLY CORRECT ROLE
      // ===============================
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
      }
    }

  } catch (err) {
    console.log("Referral role sync error:", err);
  }
}

// ===============================
// FULL SYNC ON STARTUP
// ===============================
export async function syncAllReferralRoles(client) {
  for (const guild of client.guilds.cache.values()) {
    await updateReferralRole(guild);
  }
}
