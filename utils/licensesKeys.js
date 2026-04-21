import fs from 'fs';

const PATH = './data/licenses.json';

// ==============================
// ENSURE FILE EXISTS
// ==============================
function ensureFile() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ keys: {} }, null, 2));
  }
}

// ==============================
// GENERATE KEY
// ==============================
export function generateKey(type = 'subscription', durationDays = 30) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let key = 'PREM-';
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }

  return { key, type, durationDays };
}

// ==============================
// SAVE KEY
// ==============================
export function saveKey(key, data = {}) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  db.keys[key] = {
    used: false,
    type: data.type || 'subscription',
    durationDays: data.durationDays ?? 30,
    guildId: null,
    createdAt: Date.now(),
    usedAt: null
  };

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
}

// ==============================
// VALIDATE KEY
// ==============================
export function validateKey(key) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  const entry = db.keys[key];

  if (!entry) return { valid: false, reason: 'INVALID_KEY' };
  if (entry.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry };
}

// ==============================
// CONSUME KEY
// ==============================
export function useKey(key, guildId) {
  ensureFile();

  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  const entry = db.keys[key];

  if (!entry) return false;

  entry.used = true;
  entry.guildId = guildId;
  entry.usedAt = Date.now();

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));

  return true;
}

// ==============================
// APPLY KEY TO CONFIG
// ==============================
export function applyKeyToConfig(config, keyEntry, key) {
  const now = Date.now();

  config.premium = true;
  config.mode = 'auto';
  config.licenseKey = key;

  // lifetime
  if (keyEntry.durationDays === -1) {
    config.premiumStart = now;
    config.premiumExpiary = null;
    return config;
  }

  config.premiumStart = now;
  config.premiumExpiary = now + keyEntry.durationDays * 86400000;

  return config;
}
