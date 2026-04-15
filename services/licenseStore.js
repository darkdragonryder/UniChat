import fs from 'fs';

const PATH = './data/licenses.json';

function ensure() {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ keys: {} }, null, 2));
  }
}

export function addLicenseKey(key, data = {}) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  db.keys[key] = {
    used: false,
    type: data.type || 'dev',
    durationDays: data.durationDays || 30,
    createdAt: Date.now()
  };

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
}

export function validateKey(key) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  const entry = db.keys[key];
  if (!entry) return { valid: false, reason: 'INVALID_KEY' };
  if (entry.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry };
}

export function useKey(key, guildId) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  if (!db.keys[key]) return false;

  db.keys[key].used = true;
  db.keys[key].usedBy = guildId;
  db.keys[key].usedAt = Date.now();

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
  return true;
}
