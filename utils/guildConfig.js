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

    // 🏷️ REFERRAL SYSTEM
    referrals: {
      codes: {},
      leaderboard: {},
      usedServers: {},
      rewardsGiven: {},
      badges: {},
      cycleStart: Date.now()
    },

    // 🔗 REFERRAL LINK (who referred THIS server)
    referredBy: null,

    // 🏆 ROLE SYSTEM (future-proof)
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

    const raw = fs.readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      languages: parsed.languages || {},

      premium: parsed.premium ?? false,
      licenseKey: parsed.licenseKey ?? null,
      premiumStart: parsed.premiumStart ?? null,
      premiumExpiry: parsed.premiumExpiry ?? null,

      mode: parsed.mode || 'reaction',

      // 🏷️ REFERRALS (FULL SAFE MERGE)
      referrals: {
        codes: parsed.referrals?.codes || {},
        leaderboard: parsed.referrals?.leaderboard || {},
        usedServers: parsed.referrals?.usedServers || {},
        rewardsGiven: parsed.referrals?.rewardsGiven || {},
        badges: parsed.referrals?.badges || {},
        cycleStart: parsed.referrals?.cycleStart || Date.now()
      },

      // 🔗 REFERRAL LINK
      referredBy: parsed.referredBy || null,

      // 🏆 ROLE SYSTEM
      referralRoles: parsed.referralRoles || {
        enabled: true,
        map: {
          5: "Trusted Referrer",
          10: "Elite Referrer",
          25: "Referral King",
          50: "Legend Referrer"
        }
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
// SAVE CONFIG
// =====================================================
export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  const safeConfig = {
    languages: config.languages || {},

    premium: config.premium ?? false,
    licenseKey: config.licenseKey || null,
    premiumStart: config.premiumStart || null,
    premiumExpiry: config.premiumExpiry || null,

    mode: config.mode || 'reaction',

    // 🏷️ REFERRALS SAFE SAVE
    referrals: {
      codes: config.referrals?.codes || {},
      leaderboard: config.referrals?.leaderboard || {},
      usedServers: config.referrals?.usedServers || {},
      rewardsGiven: config.referrals?.rewardsGiven || {},
      badges: config.referrals?.badges || {},
      cycleStart: config.referrals?.cycleStart || Date.now()
    },

    // 🔗 REFERRAL LINK SAVE
    referredBy: config.referredBy || null,

    // 🏆 ROLE SYSTEM SAVE
    referralRoles: config.referralRoles || {
      enabled: true,
      map: {
        5: "Trusted Referrer",
        10: "Elite Referrer",
        25: "Referral King",
        50: "Legend Referrer"
      }
    }
  };

  fs.writeFileSync(path, JSON.stringify(safeConfig, null, 2), 'utf8');
}
