import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

// =====================================================
// ENSURE DATA FOLDER
// =====================================================
function ensureDataFolder() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
}

// =====================================================
// DEFAULT CONFIG
// =====================================================
function defaultConfig() {
  const now = Date.now();

  return {
    languages: {},

    // 💎 PREMIUM SYSTEM
    premium: false,
    licenseKey: null,
    premiumStart: null,
    premiumExpiry: null,
    mode: 'reaction',

    // 🔑 LICENSE SYSTEM
    licenses: {
      devKeys: [],
      lifetimeKeys: [],
      usedKeys: {}
    },

    // 🏷️ REFERRAL SYSTEM
    referrals: {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {},
      badges: {},
      cycleStart: now
    },

    // 🔗 REFERRAL LINK
    referredBy: null,

    // 🏆 ROLE SYSTEM
    referralRoles: {
      enabled: true,
      map: {
        5: "Trusted Referrer",
        10: "Elite Referrer",
        25: "Referral King",
        50: "Legend Referrer"
      }
    }
  };
}

// =====================================================
// SAFE VALUE HELPER
// =====================================================
function safe(obj, fallback) {
  return obj !== undefined && obj !== null ? obj : fallback;
}

// =====================================================
// GET CONFIG
// =====================================================
export function getGuildConfig(guildId) {
  ensureDataFolder();

  const path = getPath(guildId);

  try {
    if (!fs.existsSync(path)) {
      const config = defaultConfig();
      fs.writeFileSync(path, JSON.stringify(config, null, 2));
      return config;
    }

    const parsed = JSON.parse(fs.readFileSync(path, 'utf8'));

    const base = defaultConfig();

    return {
      ...base,
      ...parsed,

      licenses: {
        ...base.licenses,
        ...(parsed.licenses || {})
      },

      referrals: {
        ...base.referrals,
        ...(parsed.referrals || {})
      },

      referralRoles: {
        ...base.referralRoles,
        ...(parsed.referralRoles || {})
      }
    };

  } catch (err) {
    console.log("⚠️ Config corrupted, resetting:", guildId);

    const config = defaultConfig();
    fs.writeFileSync(path, JSON.stringify(config, null, 2));

    return config;
  }
}

// =====================================================
// SAVE CONFIG (SAFE WRITE)
// =====================================================
export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  const safeConfig = {
    languages: safe(config.languages, {}),

    premium: safe(config.premium, false),
    licenseKey: safe(config.licenseKey, null),
    premiumStart: safe(config.premiumStart, null),
    premiumExpiry: safe(config.premiumExpiry, null),
    mode: safe(config.mode, 'reaction'),

    licenses: {
      devKeys: safe(config.licenses?.devKeys, []),
      lifetimeKeys: safe(config.licenses?.lifetimeKeys, []),
      usedKeys: safe(config.licenses?.usedKeys, {})
    },

    referrals: {
      codes: safe(config.referrals?.codes, {}),
      leaderboard: safe(config.referrals?.leaderboard, {}),
      usedServers: safe(config.referrals?.usedServers, {}),
      rewardsGiven: safe(config.referrals?.rewardsGiven, {}),
      badges: safe(config.referrals?.badges, {}),
      cycleStart: safe(config.referrals?.cycleStart, Date.now())
    },

    referredBy: safe(config.referredBy, null),

    referralRoles: {
      enabled: safe(config.referralRoles?.enabled, true),
      map: safe(config.referralRoles?.map, {
        5: "Trusted Referrer",
        10: "Elite Referrer",
        25: "Referral King",
        50: "Legend Referrer"
      })
    }
  };

  // 🔒 atomic-style write (prevents partial JSON corruption)
  const tmpPath = `${path}.tmp`;

  fs.writeFileSync(tmpPath, JSON.stringify(safeConfig, null, 2), 'utf8');
  fs.renameSync(tmpPath, path);
}
