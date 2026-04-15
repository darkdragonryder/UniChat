import { getGuildConfig } from '../utils/guildConfig.js';

const ROLE_TIERS = [
  { count: 1, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 5, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 10, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 25, name: '💎 Referral King', color: 0x9b59b6 },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

function getTier(count) {
  return [...ROLE_TIERS].reverse().find(t => count >= t.count) || ROLE_TIERS[0];
}

async function getOrCreateRole(guild, tier) {
  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    role = await guild.roles.create({
      name: tier.name,
      color: tier.color,
      reason: 'Referral system role'
    });
  }

  return role;
}

export async function updateReferralRole(guild, leaderboard = {}) {
  try {
    const config = getGuildConfig(guild.id);
    const lb = leaderboard || config?.referrals?.leaderboard || {};

    if (!lb || Object.keys(lb).length === 0) return;

    const members = await guild.members.fetch();

    for (const [userId, count] of Object.entries(lb)) {
      const member = members.get(userId);
      if (!member) continue;

      const tier = getTier(count);
      const role = await getOrCreateRole(guild, tier);

      // remove old roles
      for (const t of ROLE_TIERS) {
        const r = guild.roles.cache.find(x => x.name === t.name);
        if (r && member.roles.cache.has(r.id) && r.id !== role.id) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      // apply role
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
      }
    }
  } catch (err) {
    console.log("Role sync error:", err);
  }
}
