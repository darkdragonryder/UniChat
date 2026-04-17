import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// ==============================
// OPEN DB
// ==============================
const dbPromise = open({
  filename: './data/licenses.db',
  driver: sqlite3.Database
});

// ==============================
// INIT DB (SAFE)
// ==============================
async function init() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      used INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      durationDays INTEGER,
      createdAt INTEGER,
      usedAt INTEGER,
      usedByGuild TEXT,
      usedByUser TEXT
    )
  `);

  console.log('✅ License DB ready');
}

init().catch(err => {
  console.error('❌ DB init failed:', err);
});

// ==============================
// GENERATE KEY
// ==============================
export async function generateLicenseKey(type, durationDays) {
  const db = await dbPromise;

  const key = `${type.toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

  await db.run(
    `INSERT INTO licenses (
      key, used, type, durationDays, createdAt,
      usedAt, usedByGuild, usedByUser
    ) VALUES (?, 0, ?, ?, ?, NULL, NULL, NULL)`,
    [key, type, durationDays ?? null, Date.now()]
  );

  console.log('🔑 License created:', key);

  return key;
}

// ==============================
// VALIDATE KEY
// ==============================
export async function validateKey(key) {
  const db = await dbPromise;

  const row = await db.get(
    `SELECT * FROM licenses WHERE key = ?`,
    [key]
  );

  if (!row) {
    return { valid: false, reason: 'INVALID_KEY' };
  }

  if (row.used === 1) {
    return { valid: false, reason: 'ALREADY_USED' };
  }

  return { valid: true, entry: row };
}

// ==============================
// USE KEY
// ==============================
export async function useKey(key, guildId, userId = null) {
  const db = await dbPromise;

  const row = await db.get(
    `SELECT used FROM licenses WHERE key = ?`,
    [key]
  );

  if (!row || row.used === 1) return false;

  await db.run(
    `UPDATE licenses
     SET used = 1,
         usedByGuild = ?,
         usedByUser = ?,
         usedAt = ?
     WHERE key = ?`,
    [guildId, userId, Date.now(), key]
  );

  console.log('✅ License used:', key);

  return true;
}
