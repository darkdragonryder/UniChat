import { ChannelType } from 'discord.js';
import { getCachedGuildSetup, refreshGuildSetup } from './guildCache.js';

// ==============================
// REPAIR GUILD
// ==============================
export async function repairGuild(guild) {
  try {
    const setup = getCachedGuildSetup(guild.id);
    if (!setup?.roles?.length) return;

    for (const r of setup.roles) {
      const lang = r.lang;

      // ======================
      // ROLE CHECK
      // ======================
      let role = guild.roles.cache.get(r.roleId);

      if (!role) {
        role = await guild.roles.create({
          name: `🌍 ${lang.toUpperCase()}`,
          reason: 'Auto repair role'
        });
      }

      // ======================
      // CHANNEL CHECK
      // ======================
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

    await refreshGuildSetup(guild.id);
    console.log(`🔧 Repaired guild: ${guild.name}`);

  } catch (err) {
    console.log('❌ Repair error:', err);
  }
}
