import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

// ==============================
// ENSURE DATA FOLDER
// ==============================
function ensureDataFolder() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
}

// ==============================
// DEFAULT CONFIG
// ==============================
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

// ==============================
// GET CONFIG
// ==============================
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

    // IMPORTANT FIX:
    // deep merge instead of shallow spread (prevents undefined overwrites)
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

// ==============================
// SAVE CONFIG (SAFE + CONSISTENT)
// ==============================
export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  const safeConfig = {
    ...defaultConfig(),

    ...config,

    licenses: {
      ...defaultConfig().licenses,
      ...(config.licenses || {})
    },

    referrals: {
      ...defaultConfig().referrals,
      ...(config.referrals || {})
    },

    referralRoles: {
      ...defaultConfig().referralRoles,
      ...(config.referralRoles || {})
    }
  };

  const tmpPath = `${path}.tmp`;

  fs.writeFileSync(tmpPath, JSON.stringify(safeConfig, null, 2), 'utf8');
  fs.renameSync(tmpPath, path);
}
