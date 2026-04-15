const OWNER_ID = process.env.OWNER_ID;

export function isOwner(userId) {
  return userId === OWNER_ID;
}

export async function applyOwnerBadge(guild, member) {
  if (member.id !== OWNER_ID) return;

  let role = guild.roles.cache.find(r => r.name === '👑 Bot Owner');

  if (!role) {
    role = await guild.roles.create({
      name: '👑 Bot Owner',
      color: 0xFFD700,
      reason: 'Owner badge system'
    });
  }

  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}
