const userActionMap = new Map();
const cooldownMap = new Map();

// =====================================================
// ANTI FRAUD / ANTI SPAM CHECK
// =====================================================
export function checkFraud({ userId, ownerId, code }) {
  const now = Date.now();

  // ===============================
  // SELF USE CHECK
  // ===============================
  if (userId === ownerId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  // ===============================
  // RATE LIMIT (10 min window)
  // ===============================
  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  userActionMap.set(userId, recent);

  // ===============================
  // CODE SPAM PROTECTION
  // ===============================
  if (code) {
    const last = cooldownMap.get(code);

    if (last && now - last < 5000) {
      return { ok: false, reason: 'CODE_SPAM' };
    }

    cooldownMap.set(code, now);
  }

  return { ok: true };
}

// =====================================================
// OPTIONAL RESET (future admin tools)
// =====================================================
export function resetFraudData(userId) {
  userActionMap.delete(userId);
}
