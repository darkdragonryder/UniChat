import fs from 'fs';

const FILE = './data/userLang.json';

function load() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function setUserLang(userId, lang) {
  const data = load();
  data[userId] = lang.toUpperCase();
  save(data);
}

export function getUserLang(userId) {
  const data = load();
  return data[userId] || 'EN';
}
