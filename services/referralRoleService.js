const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 10, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 25, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

function getTier(count) {
  return [...ROLE_TIERS].reverse().find(t => count >= t.count);
}

async function getOrCreateRole(guild, tier) {
  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    role = await guild.roles.create({
      name: tier.name,
      color: tier.color,
      reason: 'Referral system'
    });
  }

  return role;
}

export async function applyReferralRole(guild, member, count) {
  const tier = getTier(count);
  if (!tier) return;

  const role = await getOrCreateRole(guild, tier);

  for (const t of ROLE_TIERS) {
    const r = guild.roles.cache.find(x => x.name === t.name);
    if (r && member.roles.cache.has(r.id) && r.id !== role.id) {
      await member.roles.remove(r).catch(() => {});
    }
  }

  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}
