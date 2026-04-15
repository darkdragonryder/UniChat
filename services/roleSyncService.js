import { getGuildConfig } from '../utils/guildConfig.js';

// ===============================
// SYNC REFERRAL ROLES (OPTIMIZED)
// ===============================
export async function syncReferralRoles(client, guild) {
  try {
    const config = getGuildConfig(guild.id);

    if (!config.referralRoles?.enabled) return;

    const map = config.referralRoles.map || {};
    const leaderboard = config.referrals?.leaderboard || {};

    if (!leaderboard || Object.keys(leaderboard).length === 0) return;

    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;

    // cache roles once per run (IMPORTANT FIX)
    const roleCache = new Map();

    const getRole = async (name) => {
      if (roleCache.has(name)) return roleCache.get(name);

      let role = guild.roles.cache.find(r => r.name === name);

      if (!role) {
        role = await guild.roles.create({
          name,
          color: 0xFFD700,
          reason: 'Auto referral role system'
        });
      }

      roleCache.set(name, role);
      return role;
    };

    for (const member of members.values()) {
      const count = leaderboard[member.id] || 0;

      if (count <= 0) continue;

      // find best role tier
      const eligible = Object.entries(map)
        .filter(([req]) => count >= Number(req))
        .sort((a, b) => Number(b[0]) - Number(a[0]));

      const roleName = eligible[0]?.[1];
      if (!roleName) continue;

      const role = await getRole(roleName);

      // remove other referral roles safely
      for (const name of Object.values(map)) {
        if (name === roleName) continue;

        const r = guild.roles.cache.find(x => x.name === name);
        if (r && member.roles.cache.has(r.id)) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      // apply correct role
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
      }
    }

  } catch (err) {
    console.log("Referral role sync error:", err);
  }
}
