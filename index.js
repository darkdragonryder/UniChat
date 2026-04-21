import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  Collection
} from 'discord.js';

import { loadGuildCache } from './services/guildCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// CLIENT
// ==============================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = (await import(`file://${path.join(commandsPath, file)}`)).default;

  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded: ${command.data.name}`);
  }
}

// ==============================
// READY
// ==============================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  try {
    await loadGuildCache(client);
  } catch (err) {
    console.error('Cache error:', err);
  }

  console.log(`🚀 Cache ready: ${client.guilds.cache.size} guilds`);
});

// ==============================
// COMMAND HANDLER
// ==============================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Command error',
        ephemeral: true
      });
    }
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
