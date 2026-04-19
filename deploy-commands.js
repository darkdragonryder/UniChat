import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// ==============================
// LOAD ONLY COMMAND DATA (NO EXECUTION)
// ==============================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  const { default: command } = await import(`file://${filePath}`);

  // ⚠️ ONLY use .data (no runtime code)
  if (!command?.data) {
    console.log(`❌ Skipping ${file} (no data export)`);
    continue;
  }

  commands.push(command.data.toJSON());
}

// ==============================
// REGISTER COMMANDS
// ==============================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} commands...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Commands deployed successfully');
  } catch (err) {
    console.error('❌ Deploy failed:', err);
  }
})();
