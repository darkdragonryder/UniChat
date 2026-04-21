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
// AUTO DEPLOY TOGGLE
// ==============================
const AUTO_DEPLOY_COMMANDS = process.env.AUTO_DEPLOY === 'true';
let hasDeployed = false;

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
      console.log(`❌ Skipping ${file} (invalid command)`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded: ${command.data.name}`);

  } catch (err) {
    console.log(`❌ Failed to load ${file}:`, err.message);
  }
}

// ==============================
// DEPLOY COMMANDS
// ==============================
async function deployCommands() {
  const commands = [];

  for (const [, command] of client.commands) {
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  console.log('🚀 Deploying GLOBAL slash commands...');

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log(`✅ Deployed ${commands.length} commands`);
}

// ==============================
// READY EVENT
// ==============================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  // AUTO DEPLOY
  if (AUTO_DEPLOY_COMMANDS && !hasDeployed) {
    hasDeployed = true;

    console.log('⚙️ Auto-deploy ENABLED');

    try {
      await deployCommands();
    } catch (err) {
      console.error('❌ Deploy failed:', err);
    }

  } else {
    console.log('⚙️ Auto-deploy DISABLED or already deployed');
  }

  await loadGuildCache(client);

  client.guilds.cache.forEach(guild => {
    syncGuildLicenseExpiry(guild.id);
    repairGuild(guild);
  });

  setInterval(() => {
    runLicenseCron();
  }, 60 * 60 * 1000);

  setInterval(() => {
    client.guilds.cache.forEach(guild => {
      syncGuildLicenseExpiry(guild.id);
      repairGuild(guild);
    });
  }, 60 * 60 * 1000);
});

// ==============================
// COMMAND HANDLER (UPDATED WITH GUARD)
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

    const msg = '❌ Error executing command';

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
