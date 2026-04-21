import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = './commands';

const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs.readdirSync(`${commandsPath}/${folder}`);

  for (const file of files) {
    const command = await import(`./commands/${folder}/${file}`);
    client.commands.set(command.default.data.name, command.default);
    console.log(`✅ Loaded: ${command.default.data.name}`);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({ content: 'Error', ephemeral: true });
  }
});

client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
