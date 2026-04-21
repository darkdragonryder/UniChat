import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  Client,
  GatewayIntentBits,
  Collection
} from 'discord.js';

import { globalGuard } from './middleware/globalGuard.js';
import { handleLicensePanel } from './handlers/licensePanel.js';

// ==============================
// PATH SETUP
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// CLIENT SETUP
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);

  if (!fs.lstatSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);

    try {
      const command = (await import(`file://${filePath}`)).default;

      if (!command?.data) continue;

      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded: ${command.data.name}`);

    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err.message);
    }
  }
}

// ==============================
// READY EVENT
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// INTERACTION HANDLER
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const allowed = await globalGuard(interaction, command);
      if (!allowed) return;

      await command.execute(interaction);
      return;
    }

    // AUTOCOMPLETE
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }

      return;
    }

    // PANEL SYSTEM (buttons + dropdowns)
    if (
      interaction.isStringSelectMenu() ||
      interaction.isButton()
    ) {
      if (interaction.customId.startsWith('license_')) {
        return handleLicensePanel(interaction);
      }

      return;
    }

  } catch (err) {
    console.error('Interaction error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Unexpected error occurred',
        ephemeral: true
      });
    }
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
