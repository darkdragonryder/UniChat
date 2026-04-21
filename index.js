import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  Client,
  GatewayIntentBits,
  Collection
} from 'discord.js';

// ==============================
// CORE SERVICES (V8 STACK)
// ==============================
import { globalGuard } from './middleware/globalGuard.js';
import { handleLicensePanel } from './handlers/licensePanel.js';
import { runLicenseSync } from './services/licenseSync.js';

// optional V7 API layer (safe even if unused)
import { validateLicense } from './api/licenseAPI.js';

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
    GatewayIntentBits.Guilds
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS SYSTEM
// ==============================
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Missing commands folder');
  process.exit(1);
}

const folders = fs.readdirSync(commandsPath);

console.log('📂 Loading commands...');

for (const folder of folders) {

  const folderPath = path.join(commandsPath, folder);

  if (!fs.lstatSync(folderPath).isDirectory()) continue;

  console.log(`📁 ${folder}`);

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of files) {

    const filePath = path.join(folderPath, file);

    try {
      const mod = await import(`file://${filePath}`);
      const command = mod.default;

      if (!command?.data || !command?.execute) {
        console.log(`❌ Invalid command: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded: ${command.data.name}`);

    } catch (err) {
      console.error(`❌ Failed: ${file}`);
      console.error(err);
    }
  }
}

// ==============================
// READY EVENT (V8 CORE SYNC)
// ==============================
client.once('ready', async () => {

  console.log(`🚀 Logged in as ${client.user.tag}`);

  // 🔄 Run license cleanup sync
  await runLicenseSync(client);

  // 🔁 periodic sync (self-healing system)
  setInterval(() => {
    runLicenseSync(client);
  }, 5 * 60 * 1000);

});

// ==============================
// INTERACTION HANDLER (V8 ROUTER)
// ==============================
client.on('interactionCreate', async (interaction) => {

  try {

    // =========================
    // SLASH COMMANDS
    // =========================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const allowed = await globalGuard(interaction, command);
      if (!allowed) return;

      await command.execute(interaction);
      return;
    }

    // =========================
    // AUTOCOMPLETE
    // =========================
    if (interaction.isAutocomplete()) {

      const command = client.commands.get(interaction.commandName);

      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }

      return;
    }

    // =========================
    // LICENSE PANEL SYSTEM
    // =========================
    if (
      interaction.isStringSelectMenu() ||
      interaction.isButton()
    ) {

      if (
        interaction.customId.startsWith('license_') ||
        interaction.customId.startsWith('v4_') ||
        interaction.customId.startsWith('v6_') ||
        interaction.customId.startsWith('revoke_')
      ) {
        return handleLicensePanel(interaction);
      }

      return;
    }

  } catch (err) {
    console.error('❌ Interaction error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Unexpected error occurred',
        ephemeral: true
      });
    }
  }
});

// ==============================
// OPTIONAL LICENSE CHECK HOOK (API READY)
// ==============================
export async function checkGuildLicense(guildId) {
  return await validateLicense(guildId);
}

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
