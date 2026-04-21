import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =====================
// LOAD COMMANDS RECURSIVE
// =====================
function load(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      load(full);
    } else if (file.endsWith('.js')) {
      import(`file://${full}`).then(cmd => {
        if (cmd.default?.data) {
          client.commands.set(cmd.default.data.name, cmd.default);
          console.log(`✅ Loaded: ${cmd.default.data.name}`);
        }
      });
    }
  }
}

load(path.join(__dirname, 'commands'));

// =====================
// READY
// =====================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
  console.log(`🚀 Guilds: ${client.guilds.cache.size}`);
});

// =====================
// INTERACTIONS
// =====================
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
        content: '❌ Error executing command',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
