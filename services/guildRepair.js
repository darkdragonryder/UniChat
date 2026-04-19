import { ChannelType } from 'discord.js';
import { getCachedGuildSetup, refreshGuildSetup } from './guildCache.js';

// ==============================
// AUTO REPAIR GUILD
// ==============================
export async function repairGuild(guild) {
  try {
    const setup = getCachedGuildSetup(guild.id);
    if (!setup) return;

    const languages = setup.roles.map(r => r.lang);

    for (const lang of languages) {

      // ==============================
      // CHECK ROLE
      // ==============================
      let role = guild.roles.cache.get(
        setup.roles.find(r => r.lang === lang)?.roleId
      );

      if (!role) {
        role = await guild.roles.create({
          name: `🌍 ${lang.toUpperCase()}`,
          reason: 'Auto repair role'
        });
      }

      // ==============================
      // CHECK CHANNEL
      // ==============================
      const channelName = `chat-${lang}`;

      let channel = guild.channels.cache.find(
        c => c.name === channelName
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: ['ViewChannel']
            },
            {
              id: role.id,
              allow: ['ViewChannel', 'SendMessages']
            }
          ]
        });
      }
    }

    // refresh cache after repair
    await refreshGuildSetup(guild.id);

    console.log(`🔧 Repaired guild: ${guild.name}`);

  } catch (err) {
    console.log('Repair error:', err);
  }
}
