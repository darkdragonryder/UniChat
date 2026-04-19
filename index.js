import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

import { createGuildSetup } from './services/guildSetupStore.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==============================
// READY EVENT
// ==============================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'UniChat Translation 🌍',
        type: 3
      }
    ]
  });
});

// ==============================
// AUTO SETUP WHEN JOINING SERVER
// ==============================
client.on('guildCreate', async (guild) => {
  try {
    console.log(`📥 Joined guild: ${guild.name}`);

    // Ensure DB setup exists
    await createGuildSetup(guild);

    // Create language roles
    const languages = [
      'English',
      'French',
      'German',
      'Spanish',
      'Korean',
      'Chinese',
      'Japanese',
      'Arabic'
    ];

    for (const lang of languages) {
      const roleName = `🌍 ${lang}`;

      const exists = guild.roles.cache.find(r => r.name === roleName);

      if (!exists) {
        await guild.roles.create({
          name: roleName,
          reason: 'UniChat language system setup'
        });
      }
    }

    console.log(`✅ Setup complete for ${guild.name}`);

  } catch (err) {
    console.log('❌ Guild setup error:', err);
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
