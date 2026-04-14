import { getGuildConfig } from '../utils/guildConfig.js';

const BADGE_LEVELS = [5, 10, 25, 50];

export async function updateReferralRoles(guild, member, referralCount) {
  const config = getGuildConfig(guild.id);

  if (!config.referralRoles?.enabled) return;

  const roleMap = config.referralRoles.map || {};

  let targetRoleName = null;

  // find highest matching role
  for (const level of BADGE_LEVELS) {
    if (referralCount >= level && roleMap[level]) {
      targetRoleName = roleMap[level];
    }
  }

  if (!targetRoleName) return;

  let role = guild.roles.cache.find(r => r.name === targetRoleName);

  // create role if missing
  if (!role) {
    role = await guild.roles.create({
      name: targetRoleName,
      color: 0xFFD700,
      reason: "Referral badge system auto role"
    });
  }

  // remove old referral roles
  const allRoles = Object.values(roleMap);

  for (const rName of allRoles) {
    const r = guild.roles.cache.find(x => x.name === rName);
    if (r && member.roles.cache.has(r.id) && r.name !== targetRoleName) {
      await member.roles.remove(r).catch(() => {});
    }
  }

  // add correct role
  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}
