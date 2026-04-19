import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = (await import(`file://${filePath}`)).default;

  client.commands.set(command.data.name, command);
  console.log(`✅ Loaded: ${command.data.name}`);
}

// ==============================
// READY
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// INTERACTIONS
// ==============================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply('❌ Error executing command');
    } else {
      await interaction.reply({ content: '❌ Error executing command', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
