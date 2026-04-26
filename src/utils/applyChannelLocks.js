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

  for (const [lang, channelId] of Object.entries(enabled_channels || {})) {

    const roleName = roleMap[lang];
    if (!roleName) continue;

    const role = guild.roles.cache.find(r => r.name === roleName);
    const channel = guild.channels.cache.get(channelId);

    if (!role || !channel) continue;

    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });

    await channel.permissionOverwrites.edit(role, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
  }
}
