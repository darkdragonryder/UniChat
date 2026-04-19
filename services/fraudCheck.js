const userActionMap = new Map();
const cooldownMap = new Map();

// =====================================================
// CLEANUP (prevents memory leaks)
// =====================================================
setInterval(() => {
  const now = Date.now();

  // cleanup user actions older than 10 min
  for (const [userId, actions] of userActionMap.entries()) {
    const filtered = actions.filter(t => now - t < 10 * 60 * 1000);

    if (filtered.length === 0) {
      userActionMap.delete(userId);
    } else {
      userActionMap.set(userId, filtered);
    }
  }

  // cleanup cooldowns older than 30 sec
  for (const [key, time] of cooldownMap.entries()) {
    if (now - time > 30 * 1000) {
      cooldownMap.delete(key);
    }
  }

}, 60 * 1000);

// =====================================================
// FRAUD CHECK (FINAL HARDENED)
// =====================================================
export function checkFraud({ userId, ownerId, code, guildId }) {
  const now = Date.now();

  // ===============================
  // OWNER SELF USE BLOCK (optional)
  // ===============================
  if (userId === ownerId && process.env.BLOCK_OWNER_SELF_USE === 'true') {
    logFraud(userId, 'SELF_USE_BLOCKED', code);
    return { ok: false, reason: 'SELF_USE_BLOCKED' };
  }

  // ===============================
  // USER RATE LIMIT (3 / 10 min)
  // ===============================
  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    logFraud(userId, 'RATE_LIMIT', code);
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
      logFraud(userId, 'CODE_SPAM', code);
      return { ok: false, reason: 'CODE_SPAM' };
    }

    cooldownMap.set(code, now);
  }

  // ===============================
  // GUILD SPAM PROTECTION
  // ===============================
  if (guildId) {
    const guildKey = `${guildId}:${userId}`;
    const lastGuild = cooldownMap.get(guildKey);

    if (lastGuild && now - lastGuild < 3000) {
      logFraud(userId, 'GUILD_SPAM', code);
      return { ok: false, reason: 'GUILD_SPAM' };
    }

    cooldownMap.set(guildKey, now);
  }

  return { ok: true };
}

// =====================================================
// FRAUD LOGGER (SAFE + OPTIONAL)
// =====================================================
function logFraud(userId, reason, code) {
  console.log(`🚨 FRAUD BLOCKED → User: ${userId} | Reason: ${reason} | Code: ${code || 'N/A'}`);

  // OPTIONAL: webhook support (only if you set it)
  if (process.env.FRAUD_WEBHOOK_URL) {
    try {
      fetch(process.env.FRAUD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 Fraud blocked\nUser: ${userId}\nReason: ${reason}\nCode: ${code || 'N/A'}`
        })
      }).catch(() => {});
    } catch {}
  }
}

// =====================================================
// RESET (ADMIN TOOL)
// =====================================================
export function resetFraudData(userId) {
  if (userId) {
    userActionMap.delete(userId);
  } else {
    userActionMap.clear();
    cooldownMap.clear();
  }
}
