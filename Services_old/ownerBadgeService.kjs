const OWNER_ID = process.env.OWNER_ID;

// ===============================
// CHECK OWNER
// ===============================
export function isOwner(userId) {
  return userId === OWNER_ID;
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
