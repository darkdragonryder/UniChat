import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

function ensureDataFolder() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
}

function defaultConfig() {
  return {
    languages: {},

    // 💎 premium system
    premium: false,
    licenseKey: null,
    premiumExpiry: null, // timestamp

    // ⚙️ mode control
    mode: 'reaction', // reaction | auto | hybrid

    // 📈 invite system
    invites: {}
  };
}

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
      premiumExpiry: parsed.premiumExpiry ?? null,

      mode: parsed.mode || 'reaction',

      invites: parsed.invites || {}
    };

  } catch (err) {
    console.log("⚠️ Config corrupted, resetting:", guildId);

    const config = defaultConfig();
    fs.writeFileSync(path, JSON.stringify(config, null, 2));

    return config;
  }
}

export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  const safeConfig = {
    languages: config.languages || {},

    premium: config.premium ?? false,
    licenseKey: config.licenseKey || null,
    premiumExpiry: config.premiumExpiry || null,

    mode: config.mode || 'reaction',

    invites: config.invites || {}
  };

  fs.writeFileSync(path, JSON.stringify(safeConfig, null, 2), 'utf8');
}
