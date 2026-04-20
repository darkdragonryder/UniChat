const userActionMap = new Map();
const cooldownMap = new Map();
const punishMap = new Map();

// ==============================
// CLEANUP LOOP
// ==============================
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

// ==============================
// MAIN FRAUD CHECK
// ==============================
export function checkFraud({ userId, ownerId, code, guildId }) {
  const now = Date.now();

  const punishment = punishMap.get(userId);
  if (punishment && now < punishment.until) {
    return { ok: false, reason: 'LOCKED', until: punishment.until };
  }

  if (userId === ownerId && process.env.BLOCK_OWNER_SELF_USE === 'true') {
    punish(userId, 'SELF_USE_BLOCKED');
    return { ok: false, reason: 'SELF_USE_BLOCKED' };
  }

  const actions = userActionMap.get(userId) || [];
  const recent = actions.filter(t => now - t < 10 * 60 * 1000);

  if (recent.length >= 3) {
    punish(userId, 'RATE_LIMIT');
    return { ok: false, reason: 'RATE_LIMIT' };
  }

  recent.push(now);
  userActionMap.set(userId, recent);

  if (code) {
    const last = cooldownMap.get(code);
    if (last && now - last < 5000) {
      punish(userId, 'CODE_SPAM');
      return { ok: false, reason: 'CODE_SPAM' };
    }
    cooldownMap.set(code, now);
  }

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

// ==============================
// PUNISHMENT
// ==============================
function punish(userId, reason) {
  const now = Date.now();
  const current = punishMap.get(userId);

  let strikes = current?.strikes || 0;
  strikes++;

  let duration =
    strikes === 1 ? 60_000 :
    strikes === 2 ? 300_000 :
    strikes === 3 ? 900_000 :
    3600_000;

  punishMap.set(userId, {
    strikes,
    until: now + duration
  });

  console.log(`🚨 FRAUD ${userId} | ${reason} | strikes:${strikes}`);
}

// ==============================
// RESET
// ==============================
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
