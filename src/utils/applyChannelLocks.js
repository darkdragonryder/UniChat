import { PermissionsBitField } from "discord.js";

const roleMap = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

export async function applyChannelLocks(guild, config) {
  const { enabled_channels } = config;

  await guild.channels.fetch();

  for (const [lang, channelId] of Object.entries(enabled_channels || {})) {
    try {
      const roleName = roleMap[lang];
      if (!roleName) continue;

      const role = guild.roles.cache.find(r => r.name === roleName);
      const channel = guild.channels.cache.get(channelId);

      if (!role || !channel) continue;

      await channel.permissionOverwrites.create(guild.roles.everyone, {
        ViewChannel: false
      }).catch(() => {});

      await channel.permissionOverwrites.create(role, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => {});

    } catch (err) {
      console.log(`Lock error [${lang}]:`, err.message);
    }
  }
}
