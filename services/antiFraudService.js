const recentActions = new Map();
const codeCooldown = new Map();

export function checkFraud({ userId, ownerId, code }) {
  const now = Date.now();

  // self use
  if (userId === ownerId) {
    return { ok: false, reason: 'SELF_USE' };
  }

  // rate limit
  const actions = recentActions.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  recentActions.set(userId, recent);

  // spam protection
  const last = codeCooldown.get(code);
  if (last && now - last < 5000) {
    return { ok: false, reason: 'CODE_SPAM' };
  }

  codeCooldown.set(code, now);

  return { ok: true };
}
