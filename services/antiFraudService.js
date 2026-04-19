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
  for (const [code, time] of cooldownMap.entries()) {
    if (now - time > 30 * 1000) {
      cooldownMap.delete(code);
    }
  }
}, 60 * 1000);

// =====================================================
// ANTI FRAUD / ANTI SPAM CHECK (HARDENED)
// =====================================================
export function checkFraud({ userId, ownerId, code, guildId }) {
  const now = Date.now();

  // ===============================
  // OWNER SELF USE BLOCK (optional safety)
  // ===============================
  if (userId === ownerId && process.env.BLOCK_OWNER_SELF_USE === 'true') {
    return { ok: false, reason: 'SELF_USE_BLOCKED' };
  }

  // ===============================
  // GLOBAL USER RATE LIMIT (3 actions / 10 min)
  // ===============================
  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  userActionMap.set(userId, recent);

  // ===============================
  // CODE SPAM PROTECTION (GLOBAL)
  // ===============================
  if (code) {
    const last = cooldownMap.get(code);

    if (last && now - last < 5000) {
      return { ok: false, reason: 'CODE_SPAM' };
    }

    cooldownMap.set(code, now);
  }

  // ===============================
  // GUILD SAFETY (optional anti abuse)
  // ===============================
  if (guildId) {
    const guildKey = `${guildId}:${userId}`;
    const lastGuild = cooldownMap.get(guildKey);

    if (lastGuild && now - lastGuild < 3000) {
      return { ok: false, reason: 'GUILD_SPAM' };
    }

    cooldownMap.set(guildKey, now);
  }

  return { ok: true };
}

// =====================================================
// RESET (ADMIN TOOL)
// =====================================================
export function resetFraudData(userId) {
  if (userId) {
    userActionMap.delete(userId);
  } else {
    userActionMap.clear();
  }
}
