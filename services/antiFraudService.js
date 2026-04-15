const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 10, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 25, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// =====================================================
// ROLE CACHE (PER GUILD)
// =====================================================
const roleCache = new Map();

// =====================================================
// GET TIER
// =====================================================
function getTier(count) {
  return [...ROLE_TIERS].reverse().find(t => count >= t.count);
}

// =====================================================
// GET OR CREATE ROLE
// =====================================================
async function getOrCreateRole(guild, tier) {
  const cacheKey = `${guild.id}_${tier.name}`;

  if (roleCache.has(cacheKey)) {
    return roleCache.get(cacheKey);
  }

  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    try {
      role = await guild.roles.create({
        name: tier.name,
        color: tier.color,
        reason: 'Referral system role'
      });
    } catch (err) {
      console.log('Role create error:', err);
      return null;
    }
  }

  roleCache.set(cacheKey, role);
  return role;
}

// =====================================================
// APPLY ROLE (MAIN EXPORT)
// =====================================================
export async function applyReferralRole(guild, member, count) {
  try {
    const tier = getTier(count);
    if (!tier) return;

    const role = await getOrCreateRole(guild, tier);
    if (!role) return;

    // REMOVE OLD ROLES
    const removalPromises = [];

    for (const t of ROLE_TIERS) {
      if (t.name === tier.name) continue;

      const existing = guild.roles.cache.find(r => r.name === t.name);
      if (!existing) continue;

      if (member.roles.cache.has(existing.id)) {
        removalPromises.push(
          member.roles.remove(existing).catch(() => {})
        );
      }
    }

    await Promise.all(removalPromises);

    // ADD CORRECT ROLE
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
    }

  } catch (err) {
    console.log('Referral role error:', err);
  }
}
