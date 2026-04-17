import fs from 'fs';
import path from 'path';

// =====================================================
// FIXED RAILWAY SAFE PATH
// =====================================================
const DATA_DIR = path.resolve('/app/data');
const PATH = path.join(DATA_DIR, 'licenses.json');

// =====================================================
// ENSURE FILE EXISTS
// =====================================================
function ensure() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, JSON.stringify({ keys: {} }, null, 2));
    }
  } catch (err) {
    console.error('❌ ensure() failed:', err);
  }
}

// =====================================================
// LOAD DB
// =====================================================
function loadDB() {
  ensure();

  try {
    const raw = fs.readFileSync(PATH, 'utf8');
    const db = JSON.parse(raw || '{}');

    if (!db.keys) db.keys = {};

    return db;
  } catch (err) {
    console.error('❌ loadDB error:', err);
    return { keys: {} };
  }
}

// =====================================================
// SAVE DB
// =====================================================
function saveDB(db) {
  try {
    fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('❌ saveDB error:', err);
  }
}

// =====================================================
// ADD LICENSE KEY
// =====================================================
export function addLicenseKey(key, data = {}) {
  const db = loadDB();

  if (db.keys[key]) return false;

  db.keys[key] = {
    used: false,
    type: data.type || 'dev',
    durationDays: data.durationDays ?? 30,

    createdAt: Date.now(),
    usedAt: null,
    usedByGuild: null,
    usedByUser: null
  };

  saveDB(db);
  return true;
}

// =====================================================
// GENERATE LICENSE KEY
// =====================================================
export function generateLicenseKey(type, durationDays) {
  const key = `${type.toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

  addLicenseKey(key, { type, durationDays });

  return key;
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
  if (entry.used) return false;

  entry.used = true;
  entry.usedByGuild = guildId;
  entry.usedByUser = userId;
  entry.usedAt = Date.now();

  saveDB(db);
  return true;
}
