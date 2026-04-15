// services/antiFraudService.js

const userActions = new Map();
const codeCooldown = new Map();

export function checkRateLimit(userId) {
  const now = Date.now();

  const actions = userActions.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  userActions.set(userId, recent);

  return { ok: true };
}

export function checkCodeSpam(code) {
  const now = Date.now();

  const last = codeCooldown.get(code);
  if (last && now - last < 5000) {
    return { ok: false, reason: 'CODE_SPAM' };
  }

  codeCooldown.set(code, now);

  return { ok: true };
}

export function checkSelfUse(userId, ownerId) {
  if (userId === ownerId) {
    return { ok: false, reason: 'SELF_REFERRAL' };
  }

  return { ok: true };
}

export function runAntiFraud({ userId, ownerId, code }) {
  const self = checkSelfUse(userId, ownerId);
  if (!self.ok) return self;

  const rate = checkRateLimit(userId);
  if (!rate.ok) return rate;

  const spam = checkCodeSpam(code);
  if (!spam.ok) return spam;

  return { ok: true };
}
