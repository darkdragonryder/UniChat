import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  Collection
} from 'discord.js';

import { getGuildSetup } from './services/guildSetupStore.js';
import { translate } from './utils/translate.js';

// ==============================
// FIX __dirname (ES MODULES)
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// CLIENT SETUP
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = (await import(`file://${filePath}`)).default;

  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️ Skipped invalid command file: ${file}`);
  }
}

// ==============================
// READY
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'UniChat 🌍', type: 3 }]
  });
});

// ==============================
// SLASH COMMAND HANDLER
// ==============================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`❌ Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`⚡ Running command: ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Command error:`, error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ Error executing command.");
    } else {
      await interaction.reply({
        content: "❌ Error executing command.",
        ephemeral: true
      });
    }
  }
});

// ==============================
// TRANSLATION ENGINE
// ==============================
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;

  const setup = await getGuildSetup(message.guild.id);

  if (!setup?.enabled) return;

  // find which language channel this is
  const channelData = setup.channels.find(
    c => c.channelId === message.channel.id
  );

  // ignore if not a language channel
  if (!channelData) return;

  const sourceLang = channelData.lang;

  // ==============================
  // SEND TO OTHER LANGUAGE CHANNELS
  // ==============================
  for (const target of setup.channels) {

    if (target.channelId === message.channel.id) continue;

    try {
      const result = await translate(message.content, target.lang);

      const targetChannel = message.guild.channels.cache.get(target.channelId);

      if (!targetChannel) continue;

      await targetChannel.send({
        content: `🌍 **${message.author.username}:** ${result.text}`
      });

    } catch (err) {
      console.log('Translation error:', err);
    }
  }

  // ==============================
  // SEND TO SOURCE CHANNEL (ENGLISH)
  // ==============================
  try {
    const sourceChannel = message.guild.channels.cache.get(
      setup.sourceChannelId
    );

    if (sourceChannel) {
      const english = await translate(message.content, 'en');

      await sourceChannel.send({
        content: `🌍 **${message.author.username}:** ${english.text}`
      });
    }
  } catch (err) {
    console.log('Source channel error:', err);
  }

});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
