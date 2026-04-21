import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes
} from 'discord.js';

import { translateText } from './services/translator.js';
import { getGuildSettings } from './services/guildSettings.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();


// =====================
// LOAD COMMANDS
// =====================
const commandsPath = './commands';
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs.readdirSync(`${commandsPath}/${folder}`);

  for (const file of files) {
    const cmd = await import(`./commands/${folder}/${file}`);
    client.commands.set(cmd.default.data.name, cmd.default);
    console.log(`📄 Loaded: ${cmd.default.data.name}`);
  }
}


// =====================
// COMMAND HANDLER
// =====================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({
      content: '❌ Error executing command',
      ephemeral: true
    });
  }
});


// =====================
// AUTO TRANSLATE SYSTEM
// =====================
client.on('messageCreate', async (message) => {

  if (!message.guild) return;
  if (message.author.bot) return;

  const settings = getGuildSettings(message.guild.id);

  if (!settings.autoTranslate) return;

  try {
    const translated = await translateText(
      message.content,
      settings.targetLang
    );

    if (!translated || translated === message.content) return;

    await message.channel.send({
      content:
        `🌍 Auto Translate (${settings.targetLang})\n` +
        `${message.author.username}: ${translated}`
    });

  } catch (err) {
    console.error('Translate error:', err.message);
  }
});


// =====================
// DEPLOY COMMANDS
// =====================
async function deployCommands() {

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

  console.log('🚀 Commands deployed');
}


// =====================
// READY
// =====================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  if (process.env.AUTO_DEPLOY === 'true') {
    await deployCommands();
  }
});

client.login(process.env.DISCORD_TOKEN);
