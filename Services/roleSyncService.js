import { getGuildConfig } from '../utils/guildConfig.js';
import { getTopReferrer } from './leaderboardService.js';

// ===============================
// CONFIG
// ===============================
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
      reason: 'Auto referral champion role'
    });
  }

  return role;
}

// ===============================
// MAIN ROLE SYNC
// ===============================
export async function syncReferralRoles(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const config = getGuildConfig(guildId);

    const top = getTopReferrer(guildId);

    if (!top || !top.userId) return;

    const role = await getOrCreateRole(guild);

    const members = await guild.members.fetch();

    // ===============================
    // REMOVE ROLE FROM EVERYONE ELSE
    // ===============================
    for (const member of members.values()) {
      if (member.roles.cache.has(role.id)) {
        if (member.id !== top.userId) {
          await member.roles.remove(role).catch(() => {});
        }
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
    console.log('❌ Role sync error:', err);
  }
}

// ===============================
// FULL GUILD SYNC (ON STARTUP)
// ===============================
export async function syncAllGuildRoles(client) {
  try {
    for (const guild of client.guilds.cache.values()) {
      await syncReferralRoles(client, guild.id);
    }
  } catch (err) {
    console.log('❌ Global role sync error:', err);
  }
}

// ===============================
// AUTO UPDATE AFTER CHANGE
// ===============================
export async function updateRoleAfterReferral(client, guildId) {
  await syncReferralRoles(client, guildId);
}
