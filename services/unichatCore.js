import fs from 'fs';
import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';

// =====================================================
// CORE STATE
// =====================================================
const OWNER_ID = process.env.OWNER_ID;

// =====================================================
// OWNER
// =====================================================
export function isOwner(userId) {
  return userId === OWNER_ID;
}

// =====================================================
// PREMIUM SYSTEM
// =====================================================
export function isPremium(guildId) {
  const config = getGuildConfig(guildId);

  if (!config?.premium) return false;
  if (!config.premiumExpiry) return true;

  return Date.now() < config.premiumExpiry;
}

export function enablePremium(guildId, durationMs = 30 * 86400000) {
  const config = getGuildConfig(guildId);
  const now = Date.now();

  config.premium = true;
  config.mode = 'auto';
  config.premiumStart = now;
  config.premiumExpiry = now + durationMs;

  saveGuildConfig(guildId, config);
}

// =====================================================
// LICENSE SYSTEM (CORE ONLY - NO FILE LOGIC HERE)
// =====================================================
const licenseCache = new Map();

export function createDevKey(type = 'dev', durationDays = 30) {
  const key = `DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  licenseCache.set(key, {
    type,
    used: false,
    durationDays,
    createdAt: Date.now()
  });

  return key;
}

export function validateLicense(key) {
  const entry = licenseCache.get(key);

  if (!entry) return { valid: false, reason: 'INVALID_KEY' };
  if (entry.used) return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, entry };
}

export function useLicense(key, guildId) {
  const entry = licenseCache.get(key);
  if (!entry) return false;

  entry.used = true;
  entry.guildId = guildId;
  entry.usedAt = Date.now();

  return true;
}

// =====================================================
// REFERRAL CORE (PURE LOGIC ONLY)
// =====================================================
export function addReferral(config, ownerId) {
  if (!config.referrals) {
    config.referrals = {
      codes: {},
      leaderboard: {},
      usedServers: {}
    };
  }

  config.referrals.leaderboard[ownerId] =
    (config.referrals.leaderboard[ownerId] || 0) + 1;

  return config.referrals.leaderboard[ownerId];
}

export function getLeaderboard(guildId) {
  const config = getGuildConfig(guildId);

  return Object.entries(config?.referrals?.leaderboard || {})
    .sort((a, b) => b[1] - a[1]);
}

export function getTopReferrer(guildId) {
  const lb = getLeaderboard(guildId);
  if (!lb.length) return null;

  return {
    userId: lb[0][0],
    count: lb[0][1]
  };
}

// =====================================================
// CONFIG HELPERS
// =====================================================
export function getConfig(guildId) {
  return getGuildConfig(guildId);
}

export function setConfig(guildId, config) {
  return saveGuildConfig(guildId, config);
}
