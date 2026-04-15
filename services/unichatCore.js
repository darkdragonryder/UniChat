import fs from 'fs';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// =====================================================
// ENV
// =====================================================
const OWNER_ID = process.env.OWNER_ID;

// =====================================================
// RUNTIME CACHE
// =====================================================
const recentActions = new Map();
const codeCooldown = new Map();

// =====================================================
// ROLE TIERS
// =====================================================
const ROLE_TIERS = [
  { count: 5, name: '🥉 Rookie Referrer', color: 0x95a5a6 },
  { count: 10, name: '🥈 Trusted Referrer', color: 0x3498db },
  { count: 25, name: '🥇 Elite Referrer', color: 0xf1c40f },
  { count: 50, name: '👑 Legend Referrer', color: 0xe74c3c }
];

// =====================================================
// ENSURE CONFIG
// =====================================================
function ensure(config) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {}
    };
  }

  config.premium ||= false;
  config.mode ||= 'reaction';
  config.premiumStart ||= null;
  config.premiumExpiry ||= null;

  config.licenses ||= {
    keys: {}
  };

  return config;
}

// =====================================================
// FRAUD DETECTION
// =====================================================
function detectFraud(memberId, codeData, code) {
  const now = Date.now();

  if (codeData.ownerId === memberId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  const actions = recentActions.get(memberId) || [];
  const filtered = actions.filter(t => now - t < 10 * 60 * 1000);

  if (filtered.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  filtered.push(now);
  recentActions.set(memberId, filtered);

  const last = codeCooldown.get(code);
  if (last && now - last < 5000) {
    return { ok: false, reason: 'CODE_SPAM' };
  }

  codeCooldown.set(code, now);

  return { ok: true };
}

// =====================================================
// ROLE SYSTEM
// =====================================================
async function applyReferralRole(guild, member, count) {
  const tier = [...ROLE_TIERS].reverse().find(t => count >= t.count);
  if (!tier) return;

  let role = guild.roles.cache.find(r => r.name === tier.name);

  if (!role) {
    role = await guild.roles.create({
      name: tier.name,
      color: tier.color,
      reason: 'Unichat referral system'
    });
  }

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

// =====================================================
// OWNER SYSTEM
// =====================================================
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

// =====================================================
// LICENSE SYSTEM (DB READY LAYER)
// =====================================================
// NOTE: currently file-based, but isolated so you can swap to MongoDB later

const LICENSE_PATH = './data/licenses.json';

function loadLicenses() {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
  if (!fs.existsSync(LICENSE_PATH)) fs.writeFileSync(LICENSE_PATH, JSON.stringify({ keys: {} }, null, 2));

  return JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
}

function saveLicenses(db) {
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(db, null, 2));
}

export function addLicenseKey(key, type = 'dev', durationDays = 30) {
  const db = loadLicenses();

  db.keys[key] = {
    type,
    durationDays,
    used: false,
    usedBy: null,
    createdAt: Date.now()
  };

  saveLicenses(db);
}

export function validateKey(key) {
  const db = loadLicenses();
  const entry = db.keys[key];

  if (!entry) return { valid: false, reason: 'INVALID_KEY' };
  if (entry.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry };
}

export function useKey(key, guildId) {
  const db = loadLicenses();

  if (!db.keys[key]) return false;

  db.keys[key].used = true;
  db.keys[key].usedBy = guildId;
  db.keys[key].usedAt = Date.now();

  saveLicenses(db);
  return true;
}

// =====================================================
// REFERRAL CORE (MAIN FUNCTION)
// =====================================================
export async function redeemReferralCode(guild, member, code) {
  const config = ensure(getGuildConfig(guild.id));
  const now = Date.now();

  const ref = config.referrals.codes?.[code];
  if (!ref) return { ok: false, reason: 'INVALID_CODE' };

  const fraud = detectFraud(member.id, ref, code);
  if (!fraud.ok) return fraud;

  if (config.referrals.usedServers[member.id]) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  config.referrals.usedServers[member.id] = { code, usedAt: now };

  ref.uses++;
  ref.usedBy.push(member.id);

  const ownerId = ref.ownerId;

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  const total = config.referrals.leaderboard[ownerId];

  let reward = null;

  if (total >= 25) reward = 'lifetime';
  else if (total >= 10) reward = 'month';
  else if (total >= 5) reward = 'week';

  if (reward) {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;

    if (reward === 'week') config.premiumExpiry = now + 7 * 86400000;
    if (reward === 'month') config.premiumExpiry = now + 30 * 86400000;
    if (reward === 'lifetime') config.premiumExpiry = null;
  }

  saveGuildConfig(guild.id, config);

  await applyReferralRole(guild, member, total);

  return { ok: true, reward, total };
}

// =====================================================
// REFERRAL HELPERS
// =====================================================
export function createReferralCode(guildId, ownerId, code) {
  const config = ensure(getGuildConfig(guildId));

  config.referrals.codes[code] = {
    ownerId,
    uses: 0,
    usedBy: [],
    createdAt: Date.now()
  };

  saveGuildConfig(guildId, config);
  return code;
}

export function getLeaderboard(guildId) {
  const config = ensure(getGuildConfig(guildId));

  return Object.entries(config.referrals.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}

export function getTopReferrer(guildId) {
  const lb = getLeaderboard(guildId);
  if (!lb.length) return null;

  return {
    userId: lb[0][0],
    count: lb[0][1]
  };
}
