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
      cycleStart: Date.now()
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
// SAFE MERGE HELPERS
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

    return {
      languages: safe(parsed.languages, {}),

      // PREMIUM
      premium: safe(parsed.premium, false),
      licenseKey: safe(parsed.licenseKey, null),
      premiumStart: safe(parsed.premiumStart, null),
      premiumExpiry: safe(parsed.premiumExpiry, null),
      mode: safe(parsed.mode, 'reaction'),

      // LICENSES
      licenses: {
        devKeys: safe(parsed.licenses?.devKeys, []),
        lifetimeKeys: safe(parsed.licenses?.lifetimeKeys, []),
        usedKeys: safe(parsed.licenses?.usedKeys, {})
      },

      // REFERRALS
      referrals: {
        codes: safe(parsed.referrals?.codes, {}),
        leaderboard: safe(parsed.referrals?.leaderboard, {}),
        usedServers: safe(parsed.referrals?.usedServers, {}),
        rewardsGiven: safe(parsed.referrals?.rewardsGiven, {}),
        badges: safe(parsed.referrals?.badges, {}),
        cycleStart: safe(parsed.referrals?.cycleStart, Date.now())
      },

      referredBy: safe(parsed.referredBy, null),

      referralRoles: safe(parsed.referralRoles, {
        enabled: true,
        map: {
          5: "Trusted Referrer",
          10: "Elite Referrer",
          25: "Referral King",
          50: "Legend Referrer"
        }
      })
    };

  } catch (err) {
    console.log("⚠️ Config corrupted, resetting:", guildId);

    const config = defaultConfig();
    fs.writeFileSync(path, JSON.stringify(config, null, 2));

    return config;
  }
}

// =====================================================
// SAVE CONFIG
// =====================================================
export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  const safeConfig = {
    languages: safe(config.languages, {}),

    // PREMIUM
    premium: safe(config.premium, false),
    licenseKey: safe(config.licenseKey, null),
    premiumStart: safe(config.premiumStart, null),
    premiumExpiry: safe(config.premiumExpiry, null),
    mode: safe(config.mode, 'reaction'),

    // LICENSES
    licenses: {
      devKeys: safe(config.licenses?.devKeys, []),
      lifetimeKeys: safe(config.licenses?.lifetimeKeys, []),
      usedKeys: safe(config.licenses?.usedKeys, {})
    },

    // REFERRALS
    referrals: {
      codes: safe(config.referrals?.codes, {}),
      leaderboard: safe(config.referrals?.leaderboard, {}),
      usedServers: safe(config.referrals?.usedServers, {}),
      rewardsGiven: safe(config.referrals?.rewardsGiven, {}),
      badges: safe(config.referrals?.badges, {}),
      cycleStart: safe(config.referrals?.cycleStart, Date.now())
    },

    referredBy: safe(config.referredBy, null),

    referralRoles: safe(config.referralRoles, {
      enabled: true,
      map: {
        5: "Trusted Referrer",
        10: "Elite Referrer",
        25: "Referral King",
        50: "Legend Referrer"
      }
    })
  };

  fs.writeFileSync(path, JSON.stringify(safeConfig, null, 2), 'utf8');
}
