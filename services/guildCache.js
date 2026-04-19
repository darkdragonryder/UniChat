import { getGuildSetup } from './guildSetupStore.js';

// ==============================
// MEMORY CACHE
// ==============================
export const guildCache = new Map();

// ==============================
// LOAD CACHE
// ==============================
export async function loadGuildCache(client) {
  console.log("🔄 Loading guild setup cache...");

  for (const guild of client.guilds.cache.values()) {
    const setup = await getGuildSetup(guild.id);

    if (setup?.enabled) {
      guildCache.set(guild.id, setup);
      console.log(`✅ Cached: ${guild.name}`);
    }
  }

  console.log(`🚀 Cache ready: ${guildCache.size} guilds`);
}

// ==============================
// GET CACHE
// ==============================
export function getCachedGuildSetup(guildId) {
  return guildCache.get(guildId) || null;
}

// ==============================
// REFRESH CACHE
// ==============================
export async function refreshGuildSetup(guildId) {
  const setup = await getGuildSetup(guildId);

  if (setup?.enabled) {
    guildCache.set(guildId, setup);
  } else {
    guildCache.delete(guildId);
  }
}
