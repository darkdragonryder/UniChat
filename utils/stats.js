import fs from 'fs';
const FILE = './stats.json';

let stats = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE))
  : { messages: 0, languages: {}, users: {} };

export function track(lang, user) {
  stats.messages++;
  stats.languages[lang] = (stats.languages[lang] || 0) + 1;
  stats.users[user] = (stats.users[user] || 0) + 1;
  fs.writeFileSync(FILE, JSON.stringify(stats, null, 2));
}

export function getStats() {
  return stats;
}