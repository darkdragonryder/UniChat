import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

import { getGuildSetup } from './services/guildSetupStore.js';
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
    activities: [{ name: 'UniChat 🌍', type: 3 }]
  });
});

// ==============================
// MESSAGE HANDLER
// ==============================
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;

  // ==============================
  // LOAD SETUP
  // ==============================
  const setup = await getGuildSetup(guildId);

  if (!setup?.enabled) return;

  // ==============================
  // FIND CHANNEL LANGUAGE
  // ==============================
  const channelData = setup.channels.find(
    c => c.channelId === message.channel.id
  );

  // Ignore messages not in language channels
  if (!channelData) return;

  const sourceLang = channelData.lang;

  // ==============================
  // TRANSLATE TO ALL LANGUAGES
  // ==============================
  for (const target of setup.channels) {

    // Skip same channel
    if (target.channelId === message.channel.id) continue;

    try {
      const result = await translate(message.content, target.lang);

      const targetChannel =
        message.guild.channels.cache.get(target.channelId);

      if (!targetChannel) continue;

      await targetChannel.send({
        content: `🌍 **${message.author.username}:** ${result.text}`
      });

    } catch (err) {
      console.log('Translation error:', err);
    }
  }

  // ==============================
  // SEND TO SOURCE CHANNEL (ENGLISH)
  // ==============================
  try {
    const sourceChannel = message.guild.channels.cache.get(
      setup.sourceChannelId
    );

    if (sourceChannel) {
      const english = await translate(message.content, 'en');

      await sourceChannel.send({
        content: `🌍 **${message.author.username}:** ${english.text}`
      });
    }
  } catch (err) {
    console.log('Source channel error:', err);
  }

});

client.login(process.env.TOKEN);
