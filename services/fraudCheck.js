const userActionMap = new Map();
const cooldownMap = new Map();
const punishMap = new Map();

// =====================================================
// CLEANUP (prevents memory leaks)
// =====================================================
setInterval(() => {
  const now = Date.now();

  for (const [userId, actions] of userActionMap.entries()) {
    const filtered = actions.filter(t => now - t < 10 * 60 * 1000);
    if (filtered.length === 0) userActionMap.delete(userId);
    else userActionMap.set(userId, filtered);
  }

  for (const [key, time] of cooldownMap.entries()) {
    if (now - time > 30 * 1000) cooldownMap.delete(key);
  }

  for (const [userId, data] of punishMap.entries()) {
    if (now >= data.until) punishMap.delete(userId);
  }

}, 60 * 1000);

// =====================================================
// MAIN FRAUD CHECK
// =====================================================
export function checkFraud({ userId, ownerId, code, guildId }) {
  const now = Date.now();

  // ===============================
  // OWNER BYPASS (prevents self-lock)
  // ===============================
  if (userId === ownerId) {
    return { ok: true };
  }

  // ===============================
  // ACTIVE PUNISHMENT CHECK
  // ===============================
  const punishment = punishMap.get(userId);
  if (punishment && now < punishment.until) {
    return { ok: false, reason: 'LOCKED', until: punishment.until };
  }

  // ===============================
  // OWNER BLOCK (optional)
  // ===============================
  if (userId === ownerId && process.env.BLOCK_OWNER_SELF_USE === 'true') {
    punish(userId, 'SELF_USE_BLOCKED');
    return { ok: false, reason: 'SELF_USE_BLOCKED' };
  }

  // ===============================
  // RATE LIMIT (3 / 10 min)
  // ===============================
  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    punish(userId, 'RATE_LIMIT');
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  userActionMap.set(userId, recent);

  // ===============================
  // CODE SPAM
  // ===============================
  if (code) {
    const last = cooldownMap.get(code);

    if (last && now - last < 5000) {
      punish(userId, 'CODE_SPAM');
      return { ok: false, reason: 'CODE_SPAM' };
    }

    cooldownMap.set(code, now);
  }

  // ===============================
  // GUILD SPAM
  // ===============================
  if (guildId) {
    const guildKey = `${guildId}:${userId}`;
    const last = cooldownMap.get(guildKey);

    if (last && now - last < 3000) {
      punish(userId, 'GUILD_SPAM');
      return { ok: false, reason: 'GUILD_SPAM' };
    }

    cooldownMap.set(guildKey, now);
  }

  return { ok: true };
}

// =====================================================
// PUNISHMENT SYSTEM
// =====================================================
function punish(userId, reason) {
  const now = Date.now();

  const current = punishMap.get(userId);

  let strikes = current?.strikes || 0;
  strikes++;

  let duration;

  if (strikes === 1) duration = 60 * 1000;         // 1 min
  else if (strikes === 2) duration = 5 * 60 * 1000; // 5 min
  else if (strikes === 3) duration = 15 * 60 * 1000;
  else duration = 60 * 60 * 1000; // 1 hour

  const until = now + duration;

  punishMap.set(userId, { strikes, until });

  logFraud(userId, reason, strikes, duration);
}

// =====================================================
// LOGGER
// =====================================================
function logFraud(userId, reason, strikes, duration) {
  console.log(`🚨 FRAUD → User:${userId} | ${reason} | Strikes:${strikes} | ${duration/1000}s`);

  if (process.env.FRAUD_WEBHOOK_URL) {
    fetch(process.env.FRAUD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content:
          `🚨 Fraud detected\nUser: ${userId}\nReason: ${reason}\nStrikes: ${strikes}\nTimeout: ${duration/1000}s`
      })
    }).catch(() => {});
  }
}

// =====================================================
// RESET (ADMIN TOOL)
// =====================================================
export function resetFraudData(userId) {
  if (userId) {
    userActionMap.delete(userId);
    punishMap.delete(userId);
  } else {
    userActionMap.clear();
    cooldownMap.clear();
    punishMap.clear();
  }
}
