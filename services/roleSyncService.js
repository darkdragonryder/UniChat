import { getGuildConfig } from '../utils/guildConfig.js';

const cache = new Map();

// ===============================
// SYNC USER ROLES
// ===============================
export async function syncReferralRoles(client, guild) {
  const config = getGuildConfig(guild.id);

  if (!config.referralRoles?.enabled) return;

  const map = config.referralRoles.map || {};
  const leaderboard = config.referrals?.leaderboard || {};

  const members = await guild.members.fetch();

  for (const member of members.values()) {
    const count = leaderboard[member.id] || 0;

    // find highest role they should have
    const eligible = Object.entries(map)
      .filter(([req]) => count >= Number(req))
      .sort((a, b) => Number(b[0]) - Number(a[0]));

    const shouldHaveRoleName = eligible[0]?.[1];

    if (!shouldHaveRoleName) continue;

    let role = guild.roles.cache.find(r => r.name === shouldHaveRoleName);

    if (!role) {
      role = await guild.roles.create({
        name: shouldHaveRoleName,
        color: 0xFFD700,
        reason: 'Auto referral role system'
      });
    }

    // remove other referral roles
    for (const r of Object.values(map)) {
      const existing = guild.roles.cache.find(x => x.name === r);
      if (existing && member.roles.cache.has(existing.id) && r !== shouldHaveRoleName) {
        await member.roles.remove(existing).catch(() => {});
      }
    }

    // give correct role
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
    }
  }
}
