import { getGuildSetup } from './guildSetupStore.js';

// in-memory cache (fast access)
export const guildCache = new Map();

// ==============================
// LOAD ALL GUILDS FROM DB
// ==============================
export async function loadGuildCache(client) {
  console.log("🔄 Loading guild setup cache...");

  for (const guild of client.guilds.cache.values()) {
    const setup = await getGuildSetup(guild.id);

    if (setup?.enabled) {
      guildCache.set(guild.id, setup);
      console.log(`✅ Loaded setup for ${guild.name}`);
    }
  }

  console.log(`🚀 Guild cache loaded: ${guildCache.size} guilds`);
}

// ==============================
// GET FROM CACHE
// ==============================
export function getCachedGuildSetup(guildId) {
  return guildCache.get(guildId);
}

// ==============================
// REFRESH SINGLE GUILD
// ==============================
export async function refreshGuildSetup(guildId) {
  const setup = await getGuildSetup(guildId);

  if (setup?.enabled) {
    guildCache.set(guildId, setup);
  } else {
    guildCache.delete(guildId);
  }
}
