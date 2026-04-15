import { getGuildConfig } from '../utils/guildConfig.js';

const BADGE_LEVELS = [5, 10, 25, 50];

// ===============================
// UPDATE REFERRAL ROLE
// ===============================
export async function updateReferralRoles(guild, member, referralCount) {
  const config = getGuildConfig(guild.id);

  if (!config?.referralRoles?.enabled) return;

  const roleMap = config.referralRoles?.map || {};
  const allRoles = Object.values(roleMap || {});

  // ===============================
  // FIND BEST MATCHING ROLE
  // ===============================
  let targetRoleName = null;

  for (const level of BADGE_LEVELS) {
    if (referralCount >= level && roleMap[level]) {
      targetRoleName = roleMap[level];
    }
  }

  if (!targetRoleName) return;

  // ===============================
  // GET OR CREATE ROLE
  // ===============================
  let role = guild.roles.cache.find(r => r.name === targetRoleName);

  if (!role) {
    role = await guild.roles.create({
      name: targetRoleName,
      color: 0xFFD700,
      reason: 'Referral badge system auto role'
    });
  }

  // ===============================
  // REMOVE OLD ROLES (SAFE)
  // ===============================
  await Promise.all(
    allRoles.map(async (rName) => {
      const existingRole = guild.roles.cache.find(r => r.name === rName);
      if (!existingRole) return;

      if (
        member.roles.cache.has(existingRole.id) &&
        existingRole.name !== targetRoleName
      ) {
        await member.roles.remove(existingRole).catch(() => {});
      }
    })
  );

  // ===============================
  // APPLY NEW ROLE
  // ===============================
  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}
