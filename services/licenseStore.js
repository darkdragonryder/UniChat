import db from './db.js';

// ==============================
// GENERATE LICENSE KEY
// ==============================
export function generateLicenseKey(type, durationDays) {
  const key = `${type.toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

  const createdAt = Date.now();

  const expiresAt =
    durationDays === null
      ? null
      : createdAt + durationDays * 86400000;

  db.prepare(`
    INSERT INTO licenses (
      key, used, type, durationDays, createdAt, expiresAt
    )
    VALUES (?, 0, ?, ?, ?, ?)
  `).run(
    key,
    type,
    durationDays ?? null,
    createdAt,
    expiresAt
  );

  return key;
}

// ==============================
// VALIDATE KEY
// ==============================
export function validateKey(key) {
  const row = db.prepare(`
    SELECT * FROM licenses WHERE key = ?
  `).get(key);

  if (!row) return { valid: false, reason: 'INVALID_KEY' };
  if (row.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry: row };
}

// ==============================
// USE KEY
// ==============================
export function useKey(key, guildId, userId) {
  const row = db.prepare(`
    SELECT * FROM licenses WHERE key = ?
  `).get(key);

  if (!row || row.used) return false;

  const now = Date.now();

  db.prepare(`
    UPDATE licenses
    SET used = 1,
        usedByGuild = ?,
        usedByUser = ?,
        usedAt = ?
    WHERE key = ?
  `).run(
    guildId,
    userId,
    now,
    key
  );

  return true;
}

// ==============================
// CHECK IF LICENSE ACTIVE
// ==============================
export function isLicenseActive(key) {
  const row = db.prepare(`
    SELECT * FROM licenses WHERE key = ?
  `).get(key);

  if (!row) return false;
  if (!row.used) return true;
  if (row.expiresAt === null) return true;

  return Date.now() < row.expiresAt;
}
