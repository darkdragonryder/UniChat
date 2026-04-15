import { getGuildConfig } from '../utils/guildConfig.js';

// ==============================
// SIMPLE FRAUD DETECTION CACHE
// ==============================
const recentActions = new Map();

// ==============================
// CHECK RATE LIMIT
// ==============================
export function isRateLimited(userId) {
  const now = Date.now();

  if (!recentActions.has(userId)) {
    recentActions.set(userId, []);
  }

  const timestamps = recentActions.get(userId);

  // remove old entries (10 min window)
  const filtered = timestamps.filter(t => now - t < 10 * 60 * 1000);

  if (filtered.length >= 3) {
    recentActions.set(userId, filtered);
    return true;
  }

  filtered.push(now);
  recentActions.set(userId, filtered);

  return false;
}

// ==============================
// DETECT ALT / ABUSE PATTERNS
// ==============================
export function detectFraud(guildId, userId, code) {
  const config = getGuildConfig(guildId);

  const ref = config.referrals?.codes?.[code];
  if (!ref) return { fraud: false };

  // SELF REFERRAL CHECK
  if (ref.ownerId === userId) {
    return { fraud: true, reason: 'SELF_REFERRAL' };
  }

  // RATE LIMIT CHECK
  if (isRateLimited(userId)) {
    return { fraud: true, reason: 'RATE_LIMIT' };
  }

  // SERVER FARM CHECK
  const usedServers = config.referrals?.usedServers || {};
  const usageCount = Object.keys(usedServers).length;

  if (usageCount > 5) {
    return { fraud: true, reason: 'SERVER_FARM_DETECTED' };
  }

  return { fraud: false };
}
