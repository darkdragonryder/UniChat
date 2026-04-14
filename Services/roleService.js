import { PermissionsBitField } from 'discord.js';
import { getGuildConfig } from '../utils/guildConfig.js';

const ROLE_TIERS = [
  { count: 1, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 5, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 10, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 25, name: '💎 Referral King', color: 0x9b59b6 },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// ===============================
// GET ROLE FOR COUNT
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
// CREATE OR GET ROLE
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
// MAIN ROLE SYNC
// ===============================
export async function updateReferralRole(client, guildId) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return;

  const config = getGuildConfig(guildId);
  const lb = getLeaderboard(config);

  const members = await guild.members.fetch();

  const userCounts = Object.entries(lb);

  // Track roles we created/found
  const roleCache = new Map();

  // ===============================
  // ASSIGN CORRECT ROLE PER USER
  // ===============================
  for (const [userId, count] of userCounts) {
    const member = members.get(userId);
    if (!member) continue;

    const tier = getRoleTier(count);
    const role = await getOrCreateRole(guild, tier.name, tier.color);

    roleCache.set(tier.name, role);

    // remove all referral roles first (ANTI DUPLICATE)
    for (const t of ROLE_TIERS) {
      const r = guild.roles.cache.find(x => x.name === t.name);
      if (r && member.roles.cache.has(r.id)) {
        await member.roles.remove(r).catch(() => {});
      }
    }

    // give correct role
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
    }
  }
}

// ===============================
// FULL SYNC ON STARTUP
// ===============================
export async function syncAllReferralRoles(client) {
  for (const guild of client.guilds.cache.values()) {
    await updateReferralRole(client, guild.id);
  }
}
