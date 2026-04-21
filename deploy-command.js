import fs from 'fs';
import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';

dotenv.config();

const commands = [];

const folders = fs.readdirSync('./commands');

for (const folder of folders) {
  const files = fs.readdirSync(`./commands/${folder}`);

  for (const file of files) {
    const cmd = await import(`./commands/${folder}/${file}`);
    commands.push(cmd.default.data.toJSON());
  }
}

const rest = new REST({ version: '10' })
  .setToken(process.env.DISCORD_TOKEN);

await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands }
);

console.log('🚀 Slash commands deployed');
