export async function applyChannelLocks(guild, config) {
  const { enabled_channels } = config;

  const roleMap = {
    ES: "Spanish",
    DE: "German",
    IT: "Italian",
    KO: "Korean",
    RU: "Russian",
    JA: "Japanese"
  };

  // ALWAYS FRESH FETCH (CRITICAL FIX)
  await guild.channels.fetch();

  for (const [lang, channelId] of Object.entries(enabled_channels || {})) {

    const roleName = roleMap[lang];
    if (!roleName) continue;

    const role = guild.roles.cache.find(r => r.name === roleName);
    const channel = guild.channels.cache.get(channelId);

    if (!role || !channel) continue;

    try {
      // SAFE OVERRIDES (no crash if missing access)
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: false
      }).catch(() => {});

      await channel.permissionOverwrites.edit(role, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => {});

    } catch (err) {
      console.log(`Lock failed for ${lang}:`, err.message);
    }
  }
}
