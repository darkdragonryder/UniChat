import fs from 'fs';

const PATH = './data/licenses.json';

// ---------------------
// ENSURE FILE EXISTS
// ---------------------
function ensureFile() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ keys: {} }, null, 2));
  }
}

// ---------------------
// GENERATE KEY
// ---------------------
export function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'PREM-';

  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }

  return key;
}

// ---------------------
// SAVE KEY
// ---------------------
export function saveKey(key, data = {}) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  db.keys[key] = {
    used: false,
    guildId: null,
    createdAt: Date.now(),
    ...data
  };

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
}

// ---------------------
// VALIDATE KEY
// ---------------------
export function validateKey(key) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  const entry = db.keys[key];

  if (!entry) return { valid: false, reason: 'INVALID_KEY' };
  if (entry.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry };
}

// ---------------------
// MARK USED
// ---------------------
export function useKey(key, guildId) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  if (!db.keys[key]) return false;

  db.keys[key].used = true;
  db.keys[key].guildId = guildId;
  db.keys[key].usedAt = Date.now();

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));

  return true;
}
