import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// ==============================
// LOAD COMMAND FILES
// ==============================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`file://${path.join(commandsPath, file)}`);
  commands.push(command.default.data.toJSON());
}

// ==============================
// DISCORD REST CLIENT
// ==============================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ==============================
// DEPLOY COMMANDS
// ==============================
(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Slash commands deployed successfully!');
  } catch (err) {
    console.error('❌ Failed to deploy commands:', err);
  }
})();
