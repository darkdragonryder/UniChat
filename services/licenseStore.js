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
// INIT TABLE
// ==============================
async function init() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      used INTEGER,
      type TEXT,
      durationDays INTEGER,
      createdAt INTEGER,
      usedAt INTEGER,
      usedByGuild TEXT,
      usedByUser TEXT
    )
  `);
}

// run once
init();

// ==============================
// GENERATE KEY
// ==============================
export async function generateLicenseKey(type, durationDays) {
  const key = `${type.toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

  const db = await dbPromise;

  await db.run(
    `INSERT INTO licenses VALUES (?, 0, ?, ?, ?, NULL, NULL, NULL)`,
    [key, type, durationDays ?? 30, Date.now()]
  );

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

  if (!row) return { valid: false, reason: 'INVALID_KEY' };
  if (row.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry: row };
}

// ==============================
// USE KEY
// ==============================
export async function useKey(key, guildId, userId = null) {
  const db = await dbPromise;

  const row = await db.get(
    `SELECT * FROM licenses WHERE key = ?`,
    [key]
  );

  if (!row || row.used) return false;

  await db.run(
    `UPDATE licenses
     SET used = 1,
         usedByGuild = ?,
         usedByUser = ?,
         usedAt = ?
     WHERE key = ?`,
    [guildId, userId, Date.now(), key]
  );

  return true;
}
