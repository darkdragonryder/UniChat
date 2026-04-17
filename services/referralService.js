import db from './db.js';

// ==============================
// CREATE REFERRAL CODE
// ==============================
export async function createReferralCode(guildId, ownerId) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();

  await db.run(
    `INSERT OR IGNORE INTO referral_codes
     (code, guildId, ownerId, usedCount, createdAt)
     VALUES (?, ?, ?, 0, ?)`,
    [code, guildId, ownerId, Date.now()]
  );

  console.log('🔗 Referral created:', code);

  return code;
}

// ==============================
// GET REFERRAL
// ==============================
export async function getReferral(code) {
  return await db.get(
    `SELECT * FROM referral_codes WHERE code = ?`,
    [code]
  );
}

// ==============================
// CHECK IF USER USED REFERRAL
// ==============================
export async function hasUserUsedReferral(guildId, userId) {
  const row = await db.get(
    `SELECT * FROM referrals WHERE guildId = ? AND userId = ?`,
    [guildId, userId]
  );

  return !!row;
}

// ==============================
// USE REFERRAL
// ==============================
export async function useReferral(guildId, userId, code) {
  const ref = await getReferral(code);

  if (!ref) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  if (ref.ownerId === userId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  const alreadyUsed = await hasUserUsedReferral(guildId, userId);

  if (alreadyUsed) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  // insert usage
  await db.run(
    `INSERT INTO referrals
     (guildId, userId, code, ownerId, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [guildId, userId, code, ref.ownerId, Date.now()]
  );

  // increment counter
  await db.run(
    `UPDATE referral_codes
     SET usedCount = usedCount + 1
     WHERE code = ?`,
    [code]
  );

  console.log('✅ Referral used:', code, 'by', userId);

  return {
    ok: true,
    ownerId: ref.ownerId
  };
}

// ==============================
// GET TOTAL REFERRALS FOR USER
// ==============================
export async function getReferralCount(guildId, ownerId) {
  const row = await db.get(
    `SELECT COUNT(*) as total
     FROM referrals
     WHERE guildId = ? AND ownerId = ?`,
    [guildId, ownerId]
  );

  return row?.total || 0;
}

// ==============================
// LEADERBOARD
// ==============================
export async function getLeaderboard(guildId) {
  return await db.all(
    `SELECT ownerId, COUNT(*) as total
     FROM referrals
     WHERE guildId = ?
     GROUP BY ownerId
     ORDER BY total DESC`,
    [guildId]
  );
}
