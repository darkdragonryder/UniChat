import { getTopReferrer } from './leaderboardService.js';

const ROLE_NAME = '🏆 Referral Champion';

// ===============================
// GET OR CREATE ROLE
// ===============================
async function getOrCreateRole(guild) {
  let role = guild.roles.cache.find(r => r.name === ROLE_NAME);

  if (!role) {
    role = await guild.roles.create({
      name: ROLE_NAME,
      color: 0xFFD700,
      reason: 'Referral leaderboard reward system'
    });
  }

  return role;
}

// ===============================
// MAIN ROLE SYNC (SOURCE OF TRUTH = LEADERBOARD)
// ===============================
export async function updateReferralRole(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);

    // 🔥 ALWAYS pull fresh leaderboard (no stale data passed in)
    const top = getTopReferrer(guildId);
    if (!top?.userId) return;

    const role = await getOrCreateRole(guild);

    const members = await guild.members.fetch();

    // ===============================
    // REMOVE ROLE FROM ALL NON-TOP USERS
    // ===============================
    for (const member of members.values()) {
      if (member.roles.cache.has(role.id) && member.id !== top.userId) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // ===============================
    // GIVE ROLE TO TOP USER
    // ===============================
    const topMember = await guild.members.fetch(top.userId).catch(() => null);

    if (topMember && !topMember.roles.cache.has(role.id)) {
      await topMember.roles.add(role).catch(() => {});
    }

  } catch (err) {
    console.log('❌ Role update error:', err);
  }
}

// ===============================
// FULL SERVER RESYNC (ON BOT START)
// ===============================
export async function syncAllReferralRoles(client) {
  try {
    for (const guild of client.guilds.cache.values()) {
      await updateReferralRole(client, guild.id);
    }
  } catch (err) {
    console.log('❌ Global role sync error:', err);
  }
}
