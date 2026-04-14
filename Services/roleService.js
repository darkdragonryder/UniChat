import { PermissionsBitField } from 'discord.js';

const ROLE_NAME = '🏆 Referral Champion';

export async function updateReferralRole(client, guild, leaderboard) {
  try {
    const entries = Object.entries(leaderboard || {});
    if (!entries.length) return;

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const topUserId = sorted[0][0];

    let role = guild.roles.cache.find(r => r.name === ROLE_NAME);

    if (!role) {
      role = await guild.roles.create({
        name: ROLE_NAME,
        color: 0xFFD700,
        reason: 'Referral leaderboard reward system'
      });
    }

    const members = await guild.members.fetch();

    // remove from others
    for (const member of members.values()) {
      if (member.roles.cache.has(role.id) && member.id !== topUserId) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // give to top
    const topMember = await guild.members.fetch(topUserId).catch(() => null);

    if (topMember && !topMember.roles.cache.has(role.id)) {
      await topMember.roles.add(role).catch(() => {});
    }

  } catch (err) {
    console.log("Role update error:", err);
  }
}
