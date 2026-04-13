import fs from 'fs';

export async function hasAccess(msg) {
  if (msg.author.id === process.env.OWNER_ID) return true;

  const config = JSON.parse(fs.readFileSync('./config.json'));

  if (config.allowedUsers.includes(msg.author.id)) return true;
  if (config.allowedServers.includes(msg.guild.id)) return true;

  if (msg.member.roles.cache.some(r => config.allowedRoles.includes(r.id))) return true;

  return false;
}