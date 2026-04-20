import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  // 👇 ONLY extract the builder WITHOUT executing full file logic
  const content = fs.readFileSync(filePath, 'utf8');

  // crude but effective: extract SlashCommandBuilder section
  const match = content.match(/new SlashCommandBuilder\(\)[\s\S]*?\}\);/);

  if (!match) {
    console.log(`❌ Skipping ${file} (no command builder found)`);
    continue;
  }

  // eval ONLY the builder (safe scope)
  const { SlashCommandBuilder } = await import('discord.js');

  const commandData = eval(match[0]);

  commands.push(commandData.toJSON());

  console.log(`✅ Loaded (safe): ${file}`);
}

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
