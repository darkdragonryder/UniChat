import db from './db.js';

// ==============================
// CREATE REFERRAL CODE
// ==============================
export async function createReferralCode(guildId, ownerId, code) {
  await db.run(
    `INSERT OR IGNORE INTO referral_codes (code, guildId, ownerId, usedCount, createdAt)
     VALUES (?, ?, ?, 0, ?)`,
    [code, guildId, ownerId, Date.now()]
  );
}

// ==============================
// GET REFERRAL CODE
// ==============================
export async function getReferralCode(code) {
  return await db.get(
    `SELECT * FROM referral_codes WHERE code = ?`,
    [code]
  );
}

// ==============================
// REDEEM REFERRAL CODE
// ==============================
export async function redeemReferralCode(guildId, userId, code) {
  const ref = await getReferralCode(code);

  if (!ref) {
    return { valid: false, reason: 'INVALID_CODE' };
  }

  if (ref.ownerId === userId) {
    return { valid: false, reason: 'SELF_USE' };
  }

  // already used check
  const alreadyUsed = await db.get(
    `SELECT * FROM referrals WHERE guildId = ? AND userId = ?`,
    [guildId, userId]
  );

  if (alreadyUsed) {
    return { valid: false, reason: 'ALREADY_USED' };
  }

  // insert usage
  await db.run(
    `INSERT INTO referrals (guildId, userId, code, ownerId, createdAt)
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

  return {
    valid: true,
    ownerId: ref.ownerId
  };
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
