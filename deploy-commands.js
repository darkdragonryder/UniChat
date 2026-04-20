import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// BASIC ENV CHECK
// ==============================
if (!process.env.TOKEN) {
  throw new Error('❌ TOKEN missing in .env');
}
if (!process.env.CLIENT_ID) {
  throw new Error('❌ CLIENT_ID missing in .env');
}
if (!process.env.GUILD_ID) {
  throw new Error('❌ GUILD_ID missing in .env');
}

console.log('🚀 Starting command deployment...');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);

// ==============================
// LOAD COMMAND FILES
// ==============================
const commands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  try {
    const { default: command } = await import(`file://${filePath}`);

    if (!command?.data) {
      console.log(`❌ Skipped ${file} (missing data)`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ Loaded: ${command.data.name}`);
  } catch (err) {
    console.log(`❌ Failed to load ${file}:`, err.message);
  }
}

console.log(`📦 Total commands: ${commands.length}`);

// ==============================
// DISCORD REST CLIENT
// ==============================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ==============================
// DEPLOY COMMANDS (GUILD - INSTANT)
// ==============================
(async () => {
  try {
    console.log('🚀 Deploying commands to guild...');

    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${data.length} commands`);
    console.log('🎉 Done!');
  } catch (err) {
    console.error('❌ Deploy failed:');
    console.error(err);
  }
})();
