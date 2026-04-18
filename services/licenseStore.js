import db from './db.js';

// ==============================
// GENERATE LICENSE KEY
// ==============================
export function generateLicenseKey(type, durationDays) {
  const key = `${type.toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

  db.prepare(`
    INSERT INTO licenses (key, used, type, durationDays, createdAt)
    VALUES (?, 0, ?, ?, ?)
  `).run(
    key,
    type,
    durationDays ?? 30,
    Date.now()
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

  db.prepare(`
    UPDATE licenses
    SET used = 1,
        usedByGuild = ?,
        usedByUser = ?,
        usedAt = ?
    WHERE key = ?
  `).run(guildId, userId, Date.now(), key);

  return true;
}
