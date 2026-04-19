import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

import { createGuildSetup } from './services/guildSetupStore.js';
import { getUserLanguage } from './services/userLanguageStore.js';
import { translate } from './utils/translate.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==============================
// READY
// ==============================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'UniChat Channels 🌍', type: 3 }]
  });
});

// ==============================
// GUILD SETUP
// ==============================
client.on('guildCreate', async (guild) => {
  await createGuildSetup(guild);
});

// ==============================
// CHANNEL TRANSLATION CORE
// ==============================
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;

  // ignore bot messages (prevents loops)
  if (message.webhookId) return;

  const baseChannelName = message.channel.name;

  // ignore DMs / system channels
  if (!baseChannelName) return;

  // ==============================
  // GET ALL MEMBERS LANGUAGE MAP
  // ==============================
  const members = message.guild.members.cache;

  for (const member of members.values()) {

    if (member.user.bot) continue;

    const lang = await getUserLanguage(member.id, message.guild.id);

    if (!lang) continue;

    const result = await translate(message.content, lang);

    if (!result?.text) continue;

    try {

      const channelName = `${baseChannelName}-${lang.toLowerCase()}`;

      // find or create channel
      let channel = message.guild.channels.cache.find(c => c.name === channelName);

      if (!channel) {
        channel = await message.guild.channels.create({
          name: channelName,
          type: 0 // text channel
        });
      }

      channel.send({
        content: `🌍 ${member.user.username}: ${result.text}`
      });

    } catch (err) {
      console.log('channel translate error:', err);
    }
  }

});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
