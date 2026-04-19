import { getGuildSetup } from './guildSetupStore.js';

export const guildCache = new Map();

// ==============================
// LOAD CACHE
// ==============================
export async function loadGuildCache(client) {
  console.log("🔄 Loading guild cache...");

  for (const guild of client.guilds.cache.values()) {
    try {
      const setup = await getGuildSetup(guild.id);

      if (setup?.enabled) {
        guildCache.set(guild.id, setup);
        console.log(`✅ Cached: ${guild.name}`);
      }
    } catch (err) {
      console.log(`❌ Cache error ${guild.id}`, err);
    }
  }

  console.log(`🚀 Cache ready: ${guildCache.size} guilds`);
}

// ==============================
// GET CACHE
// ==============================
export function getCachedGuildSetup(guildId) {
  return guildCache.get(guildId);
}

// ==============================
// REFRESH
// ==============================
export async function refreshGuildSetup(guildId) {
  const setup = await getGuildSetup(guildId);

  if (setup?.enabled) {
    guildCache.set(guildId, setup);
  } else {
    guildCache.delete(guildId);
  }
}
