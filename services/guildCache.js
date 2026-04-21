export async function loadGuildCache(client) {
  console.log('🔄 Loading guild cache...');

  try {
    const guilds = client.guilds.cache;

    guilds.forEach(guild => {
      console.log(`✅ Cached: ${guild.name}`);
    });

    console.log(`🚀 Cache ready: ${guilds.size} guilds`);
  } catch (err) {
    console.error('❌ Guild cache error:', err);
  }
}
