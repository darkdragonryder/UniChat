import { getGuildConfig } from './referralService.js';

// =====================================================
// BADGE DEFINITIONS
// =====================================================
const BADGES = [
  { uses: 25, name: '🥇 Elite Referrer' },
  { uses: 10, name: '🥈 Trusted Referrer' },
  { uses: 5, name: '🥉 Rising Referrer' }
];

// =====================================================
// GET OR CREATE ROLE
// =====================================================
async function getOrCreateRole(guild, name) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: 0xFFD700,
      reason: 'Referral badge system'
    });
  }

  return role;
}

// =====================================================
// APPLY BADGES
// =====================================================
export async function updateReferralBadges(client, guild) {
  const config = getGuildConfig(guild.id);

  const lb = config.referrals?.leaderboard || {};
  const entries = Object.entries(lb);

  if (entries.length === 0) return;

  // sort users
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  for (const [userId, count] of sorted) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;

    // remove all badge roles first (clean state)
    for (const badge of BADGES) {
      const role = guild.roles.cache.find(r => r.name === badge.name);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // assign best matching badge
    for (const badge of BADGES) {
      if (count >= badge.uses) {
        const role = await getOrCreateRole(guild, badge.name);
        await member.roles.add(role).catch(() => {});
        break;
      }
    }
  }
}

// =====================================================
// TOP #1 SPECIAL ROLE
// =====================================================
export async function updateTopReferrer(guild) {
  const config = getGuildConfig(guild.id);
  const lb = config.referrals?.leaderboard || {};

  const sorted = Object.entries(lb).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return;

  const topUserId = sorted[0][0];

  const roleName = '👑 Top Referrer';

  let role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    role = await guild.roles.create({
      name: roleName,
      color: 0xffd700,
      reason: 'Top referrer role'
    });
  }

  const members = await guild.members.fetch();

  // remove from everyone else
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
}
