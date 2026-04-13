import fs from 'fs';

const getPath = (guildId) => `./data/${guildId}.json`;

export function getGuildConfig(guildId) {
  try {
    return JSON.parse(fs.readFileSync(getPath(guildId), 'utf8'));
  } catch {
    const defaultConfig = {
      languages: {}
    };

    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(getPath(guildId), JSON.stringify(defaultConfig, null, 2));

    return defaultConfig;
  }
}

export function saveGuildConfig(guildId, config) {
  fs.writeFileSync(getPath(guildId), JSON.stringify(config, null, 2));
}
