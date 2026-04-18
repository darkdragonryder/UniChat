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
// DB INIT
// ==============================
import './services/db.js';

// ==============================
// LICENSE SYSTEM
// ==============================
import { isLicenseActive } from './services/licenseStore.js';

// ==============================
// UTILITIES
// ==============================
import { translate } from './utils/translate.js';

// ==============================
// SAFETY CHECK
// ==============================
if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ Missing TOKEN or CLIENT_ID');
  process.exit(1);
}

// ==============================
// CLIENT
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const cmd = await import(`./commands/${file}`);

    if (cmd?.default?.data?.name && cmd?.default?.execute) {
      client.commands.set(cmd.default.data.name, cmd.default);
    }

  } catch (err) {
    console.log(`❌ Failed loading ${file}:`, err);
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
      body: client.commands.map(c => c.data.toJSON())
    }
  );

  console.log('✅ Commands registered');

} catch (err) {
  console.log('❌ Command registration failed:', err);
}

// ==============================
// READY
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// MESSAGE TRANSLATE SYSTEM
// ==============================
client.on('messageCreate', async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    // 🔥 PREMIUM CHECK
    const premium = await isLicenseActive(message.guild.id);
    if (!premium) return;

    // 🌍 TRANSLATE
    const result = await translate(message.content, 'en');
    if (!result) return;

    await message.channel.send(`🌍 ${result.text || result}`);

  } catch (err) {
    console.log('Message error:', err);
  }
});

// ==============================
// INTERACTIONS
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    await cmd.execute(interaction);

  } catch (err) {
    console.log('Interaction error:', err);
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
