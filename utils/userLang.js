import fs from 'fs';

const FILE = './data/userLang.json';

function load() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// key = guildId-userId (IMPORTANT)
export function setUserLang(guildId, userId, lang) {
  const data = load();
  data[`${guildId}-${userId}`] = lang;
  save(data);
}

export function getUserLang(guildId, userId) {
  const data = load();
  return data[`${guildId}-${userId}`] || null;
}

export function hasUserLang(guildId, userId) {
  const data = load();
  return Boolean(data[`${guildId}-${userId}`]);
}
