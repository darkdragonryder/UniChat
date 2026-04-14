import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

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
      leaderboard: {}
    },

    // 🔗 REFERRAL LINK (who referred THIS server)
    referredBy: null
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

      // 🏷️ REFERRALS
      referrals: parsed.referrals || {
        codes: {},
        leaderboard: {}
      },

      // 🔗 REFERRAL LINK
      referredBy: parsed.referredBy || null
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

    // 🏷️ REFERRALS SAVE
    referrals: config.referrals || {
      codes: {},
      leaderboard: {}
    },

    // 🔗 REFERRAL LINK SAVE
    referredBy: config.referredBy || null
  };

  fs.writeFileSync(path, JSON.stringify(safeConfig, null, 2), 'utf8');
}
