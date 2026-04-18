import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';

import fs from 'fs';

// ==============================
// DB INIT (MUST BE FIRST)
// ==============================
import './services/db.js';

// ==============================
// SAAS SYSTEMS
// ==============================
import { startLicenseExpiryWorker } from './services/licenseExpiryWorker.js';
import { runExpiryWarnings } from './services/licenseWatcher.js';
import { runLicenseCleanup } from './services/licenseCleanup.js';

// ==============================
// UTILITIES
// ==============================
import { translate } from './utils/translate.js';
import { getGuildConfig } from './utils/guildConfig.js';
import { isPremium } from './services/unichatCore.js';

// ==============================
// SAFETY CHECK
// ==============================
if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ Missing TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

// ==============================
// CLIENT
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandFiles = fs.existsSync('./commands')
  ? fs.readdirSync('./commands').filter(f => f.endsWith('.js'))
  : [];

for (const file of commandFiles) {
  try {
    const cmd = await import(`./commands/${file}`);

    if (cmd?.default?.data?.name && cmd?.default?.execute) {
      client.commands.set(cmd.default.data.name, cmd.default);
    }
  } catch (err) {
    console.log(`❌ Failed loading command ${file}:`, err);
  }
}

// ==============================
// REGISTER COMMANDS
// ==============================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    {
      body: [
        ...client.commands.map(c => c.data.toJSON()),
        { name: 'Translate Message', type: 3 }
      ]
    }
  );

  console.log("✅ Commands registered");
} catch (err) {
  console.log("❌ Command registration failed:", err);
}

// ==============================
// READY EVENT
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  // 🔥 MAIN EXPIRY ENGINE
  startLicenseExpiryWorker();

  // ⚠️ WARNING SYSTEM (hourly)
  setInterval(() => {
    runExpiryWarnings(client);
  }, 60 * 60 * 1000);

  // 🧹 CLEANUP (6 hours backup safety sweep)
  setInterval(() => {
    runLicenseCleanup();
  }, 6 * 60 * 60 * 1000);
});

// ==============================
// MESSAGE CREATE
// ==============================
client.on('messageCreate', async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const config = getGuildConfig(message.guild.id);
    if (!config) return;

    if (!isPremium(message.guild.id)) return;

    const targetLang = config.autoTranslateLang || 'en';

    const result = await translate(message.content, targetLang);
    if (!result) return;

    await message.channel.send({
      content: `🌍 ${result?.text || result}`
    });

  } catch (err) {
    console.log("Message error:", err);
  }
});

// ==============================
// INTERACTIONS
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (!interaction.customId?.startsWith('translate_')) return;

      await interaction.deferReply({ ephemeral: true });

      const msgId = interaction.customId.split('_')[1];

      const msg = await interaction.channel?.messages
        .fetch(msgId)
        .catch(() => null);

      if (!msg) {
        return interaction.editReply('❌ Message not found');
      }

      const config = getGuildConfig(interaction.guild?.id);
      const lang = config?.languages?.[interaction.user.id] || 'en';

      const result = await translate(msg.content, lang);

      return interaction.editReply({
        content: `🌍 ${result?.text || result}`
      });
    }
  } catch (err) {
    console.log("Interaction error:", err);
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
