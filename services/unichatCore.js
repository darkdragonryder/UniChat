import fs from 'fs';
import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';

// =====================================================
// CORE BOT STATE
// (keep this file lightweight)
// =====================================================

const OWNER_ID = process.env.OWNER_ID;

// =====================================================
// BASIC OWNER CHECK
// =====================================================
export function isOwner(userId) {
  return userId === OWNER_ID;
}

// =====================================================
// PREMIUM CHECK (SAFE WRAPPER ONLY)
// =====================================================
export function isPremium(guildId) {
  const config = getGuildConfig(guildId);

  if (!config?.premium) return false;

  if (!config.premiumExpiry) return true;

  return Date.now() < config.premiumExpiry;
}

// =====================================================
// ENABLE PREMIUM (GENERIC HELPER ONLY)
// =====================================================
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
// SAFE CONFIG ACCESS HELPER
// =====================================================
export function getConfig(guildId) {
  return getGuildConfig(guildId);
}

export function setConfig(guildId, config) {
  return saveGuildConfig(guildId, config);
}
