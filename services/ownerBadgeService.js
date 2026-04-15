const OWNER_ID = process.env.OWNER_ID || '';

// ===============================
// CHECK OWNER
// ===============================
export function isOwner(userId) {
  if (!OWNER_ID || !userId) return false;

  return String(userId) === String(OWNER_ID);
}

// ===============================
// GET BADGE
// ===============================
export function getOwnerBadge(userId) {
  if (isOwner(userId)) {
    return {
      badge: '👑 Bot Owner',
      level: 'OWNER'
    };
  }

  return null;
}
