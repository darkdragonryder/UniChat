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


// =========================
// LOAD COMMANDS
// =========================
const commandsPath = path.resolve('./commands');
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs.readdirSync(`${commandsPath}/${folder}`);

  for (const file of files) {
    const command = await import(`./commands/${folder}/${file}`);
    client.commands.set(command.default.data.name, command.default);
    console.log(`📄 Loaded: ${command.default.data.name}`);
  }
}


// =========================
// SLASH COMMAND HANDLER
// =========================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: '❌ Error executing command',
      ephemeral: true
    });
  }
});


// =========================
// AUTO TRANSLATE SYSTEM
// =========================
client.on('messageCreate', async (message) => {

  if (!message.guild) return;
  if (message.author.bot) return;

  const settings = getGuildSettings(message.guild.id);

  if (!settings?.autoTranslate) return;

  try {

    const translated = await translateText(
      message.content,
      settings.targetLang || 'EN'
    );

    if (!translated || translated === message.content) return;

    await message.channel.send({
      content:
        `🌍 **Auto Translate (${settings.targetLang})**\n` +
        `👤 ${message.author.username}: ${translated}`
    });

  } catch (err) {
    console.error('Auto translate error:', err.message);
  }
});


// =========================
// AUTO DEPLOY COMMANDS
// =========================
async function deployCommands() {

  const commands = [];

  const folders = fs.readdirSync('./commands');

  for (const folder of folders) {
    const files = fs.readdirSync(`./commands/${folder}`);

    for (const file of files) {
      const command = await import(`./commands/${folder}/${file}`);
      commands.push(command.default.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log('🚀 Slash commands deployed');
}


// =========================
// READY EVENT
// =========================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  if (process.env.AUTO_DEPLOY === 'true') {
    await deployCommands();
  } else {
    console.log('⏩ Auto deploy disabled');
  }
});


// =========================
// LOGIN
// =========================
client.login(process.env.DISCORD_TOKEN);
