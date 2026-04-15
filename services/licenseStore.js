import fs from 'fs';

const PATH = './data/licenses.json';

// =====================================================
// ENSURE FILE EXISTS
// =====================================================
function ensure() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ keys: {} }, null, 2));
  }
}

// =====================================================
// LOAD DB (SAFE WRAPPER)
// =====================================================
function loadDB() {
  ensure();
  return JSON.parse(fs.readFileSync(PATH, 'utf8'));
}

// =====================================================
// SAVE DB (SAFE WRITE)
// =====================================================
function saveDB(db) {
  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
}

// =====================================================
// ADD LICENSE KEY
// =====================================================
export function addLicenseKey(key, data = {}) {
  const db = loadDB();

  db.keys[key] = {
    used: false,
    type: data.type || 'dev',
    durationDays: data.durationDays || 30,

    createdAt: Date.now(),
    usedAt: null,
    usedByGuild: null,
    usedByUser: null,

    referredBy: data.referredBy || null
  };

  saveDB(db);
}

// =====================================================
// VALIDATE KEY
// =====================================================
export function validateKey(key) {
  const db = loadDB();
  const entry = db.keys[key];

  if (!entry) {
    return { valid: false, reason: 'INVALID_KEY' };
  }

  if (entry.used) {
    return { valid: false, reason: 'ALREADY_USED' };
  }

  return { valid: true, entry };
}

// =====================================================
// USE KEY
// =====================================================
export function useKey(key, guildId, userId = null) {
  const db = loadDB();
  const entry = db.keys[key];

  if (!entry) return false;

  entry.used = true;
  entry.usedByGuild = guildId;
  entry.usedByUser = userId;
  entry.usedAt = Date.now();

  saveDB(db);
  return true;
}
