import 'dotenv/config';
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, Collection } from 'discord.js';

import { loadGuildCache } from './services/guildCache.js';
import { repairGuild } from './services/guildRepair.js';
import { syncGuildLicenseExpiry } from './services/licenseExpirySync.js';
import { runLicenseCron } from './services/licenseCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const command = (await import(`file://${filePath}`)).default;

  client.commands.set(command.data.name, command);
  console.log(`✅ Loaded: ${command.data.name}`);
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

  // license cron
  setInterval(() => {
    runLicenseCron();
  }, 60 * 60 * 1000);

  // repair + sync
  setInterval(() => {
    client.guilds.cache.forEach(guild => {
      syncGuildLicenseExpiry(guild.id);
      repairGuild(guild);
    });
  }, 60 * 60 * 1000);
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

    const msg = '❌ Error executing command';

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
