import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

function ensureDataFolder() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
}

export function getGuildConfig(guildId) {
  ensureDataFolder();

  const path = getPath(guildId);

  try {
    if (!fs.existsSync(path)) {
      const defaultConfig = {
        languages: {},
        premium: false,
        licenseKey: null,
        mode: 'reaction' // reaction | auto | hybrid (future)
      };

      fs.writeFileSync(path, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }

    const raw = fs.readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      languages: parsed.languages || {},
      premium: parsed.premium ?? false,
      licenseKey: parsed.licenseKey ?? null,
      mode: parsed.mode || 'reaction'
    };

  } catch (err) {
    console.log("⚠️ Config corrupted, resetting:", guildId);

    const resetConfig = {
      languages: {},
      premium: false,
      licenseKey: null,
      mode: 'reaction'
    };

    fs.writeFileSync(path, JSON.stringify(resetConfig, null, 2));

    return resetConfig;
  }
}

export function saveGuildConfig(guildId, config) {
  ensureDataFolder();

  const path = getPath(guildId);

  fs.writeFileSync(
    path,
    JSON.stringify(config, null, 2),
    'utf8'
  );
}
