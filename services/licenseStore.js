import fs from 'fs';
import path from 'path';

// =====================================================
// STABLE PATH (FIXES EMPTY FILE ISSUE IN RAILWAY/CODESPACES)
// =====================================================
const DATA_DIR = path.resolve(process.cwd(), 'data');
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
    console.error('❌ Ensure failed:', err);
  }
}

// =====================================================
// LOAD DB (SAFE)
// =====================================================
function loadDB() {
  ensure();

  try {
    const raw = fs.readFileSync(PATH, 'utf8');
    const db = JSON.parse(raw || '{}');

    if (!db.keys) db.keys = {};

    return db;
  } catch (err) {
    console.error('❌ License DB read error:', err);
    return { keys: {} };
  }
}

// =====================================================
// SAVE DB (SAFE)
// =====================================================
function saveDB(db) {
  try {
    fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('❌ License DB write error:', err);
  }
}

// =====================================================
// ADD LICENSE KEY
// =====================================================
export function addLicenseKey(key, data = {}) {
  const db = loadDB();

  if (db.keys[key]) {
    console.log('⚠️ Key already exists:', key);
    return false;
  }

  db.keys[key] = {
    used: false,
    type: data.type || 'dev',
    durationDays: data.durationDays ?? 30,

    createdAt: Date.now(),
    usedAt: null,
    usedByGuild: null,
    usedByUser: null,

    referredBy: data.referredBy || null
  };

  saveDB(db);

  console.log('✅ License saved:', key);

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

  const saved = addLicenseKey(key, {
    type,
    durationDays
  });

  if (!saved) {
    console.log('❌ Failed to save key:', key);
  }

  return key;
}

// =====================================================
// VALIDATE KEY
// =====================================================
export function validateKey(key)
