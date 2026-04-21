import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';

import { loadGuildCache } from './services/guildCache.js';
import { repairGuild } from './services/guildRepair.js';
import { syncGuildLicenseExpiry } from './services/licenseExpirySync.js';
import { runLicenseCron } from './services/licenseCron.js';
import { commandGuard } from './middleware/commandGuard.js';

// ==============================
// PATH SETUP
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  try {
    const command = (await import(`file://${filePath}`)).default;

    if (!command?.data || !command?.execute) {
      console.log(`❌ Skipping ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded: ${command.data.name}`);

  } catch (err) {
    console.log(`❌ Failed: ${file}`, err.message);
  }
}

// ==============================
// READY
// ==============================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  await loadGuildCache(client);

  client.guilds.cache.forEach(guild => {
    syncGuildLicenseExpiry(guild.id);
    repairGuild(guild);
  });

  setInterval(runLicenseCron, 60 * 60 * 1000);

  setInterval(() => {
    client.guilds.cache.forEach(guild => {
      syncGuildLicenseExpiry(guild.id);
      repairGuild(guild);
    });
  }, 60 * 60 * 1000);
});

// ==============================
// COMMAND HANDLER (SAFE + GUARDED)
// ==============================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await commandGuard(interaction, async (config) => {
      await command.execute(interaction, config);
    });

  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply('❌ Error executing command');
    } else {
      await interaction.reply({
        content: '❌ Error executing command',
        ephemeral: true
      });
    }
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
