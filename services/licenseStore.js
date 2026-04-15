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
// ADD LICENSE KEY (ADMIN)
// =====================================================
export function addLicenseKey(key, data = {}) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  db.keys[key] = {
    used: false,
    type: data.type || 'dev',
    durationDays: data.durationDays || 30,

    // FIXED METADATA
    createdAt: Date.now(),
    usedAt: null,
    usedByGuild: null,
    usedByUser: null,

    // REFERRAL TRACKING (NEW)
    referredBy: data.referredBy || null
  };

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
}

// =====================================================
// VALIDATE KEY
// =====================================================
export function validateKey(key) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

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
// USE KEY (MARK AS USED)
// =====================================================
export function useKey(key, guildId, userId = null) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PATH, 'utf8'));

  const entry = db.keys[key];

  if (!entry) return false;

  entry.used = true;
  entry.usedByGuild = guildId;
  entry.usedByUser = userId;
  entry.usedAt = Date.now();

  fs.writeFileSync(PATH, JSON.stringify(db, null, 2));
  return true;
}
