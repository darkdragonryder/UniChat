import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';

import fs from 'fs';

import './services/db.js';
import { isLicenseActive } from './services/licenseStore.js';
import { translate } from './utils/translate.js';
import { getUserLang } from './utils/userLang.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// LOAD COMMANDS
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  if (cmd?.default?.data?.name) {
    client.commands.set(cmd.default.data.name, cmd.default);
  }
}

// REGISTER
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  {
    body: client.commands.map(c => c.data.toJSON())
  }
);

// READY
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// MESSAGE HANDLER (SMART SYSTEM)
// ==============================
client.on('messageCreate', async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const premium = await isLicenseActive(message.guild.id);

    // FREE USERS → FLAG ONLY
    if (!premium) {
      if (!message.content.startsWith('!t ')) return;

      const text = message.content.slice(3);
      const result = await translate(text, 'EN');
      if (!result) return;

      return message.reply(`🌍 ${result.text}`);
    }

    // ==============================
    // PREMIUM → PER USER TRANSLATION
    // ==============================

    const members = await message.guild.members.fetch();

    const translations = [];

    for (const [id, member] of members) {
      if (member.user.bot) continue;

      const lang = getUserLang(id);

      const result = await translate(message.content, lang);
      if (!result) continue;

      translations.push(`**${member.user.username} (${lang})**: ${result.text}`);
    }

    if (translations.length === 0) return;

    await message.channel.send(`🌍 Translations:\n\n${translations.join('\n')}`);

  } catch (err) {
    console.log(err);
  }
});

// INTERACTIONS
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  await cmd.execute(interaction);
});

client.login(process.env.TOKEN);
