import db from './db.js';

// ==============================
// CREATE REFERRAL CODE
// ==============================
export function createReferralCode(guildId, ownerId, code) {
  db.prepare(`
    INSERT OR IGNORE INTO referral_codes (code, guildId, ownerId, usedCount, createdAt)
    VALUES (?, ?, ?, 0, ?)
  `).run(code, guildId, ownerId, Date.now());

  return code;
}

// ==============================
// GET REFERRAL
// ==============================
export function getReferral(code) {
  return db.prepare(`
    SELECT * FROM referral_codes WHERE code = ?
  `).get(code);
}

// ==============================
// GET BY OWNER
// ==============================
export function getReferralByOwner(ownerId) {
  return db.prepare(`
    SELECT * FROM referral_codes WHERE ownerId = ?
  `).get(ownerId);
}

// ==============================
// CHECK USER USED
// ==============================
export function hasUserUsedReferral(guildId, userId) {
  return !!db.prepare(`
    SELECT 1 FROM referrals
    WHERE guildId = ? AND userId = ?
  `).get(guildId, userId);
}

// ==============================
// APPLY REFERRAL
// ==============================
export function useReferral(guildId, userId, code) {
  const ref = getReferral(code);
  if (!ref) return false;

  db.prepare(`
    INSERT INTO referrals (guildId, userId, code, ownerId, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(guildId, userId, code, ref.ownerId, Date.now());

  db.prepare(`
    UPDATE referral_codes
    SET usedCount = usedCount + 1
    WHERE code = ?
  `).run(code);

  return true;
}

// ==============================
// COUNT REFERRALS
// ==============================
export function getReferralCount(ownerId) {
  const row = db.prepare(`
    SELECT COUNT(*) as count
    FROM referrals
    WHERE ownerId = ?
  `).get(ownerId);

  return row?.count || 0;
}
