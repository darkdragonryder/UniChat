import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

import fs from 'fs';

// ==============================
// CORE SERVICES
// ==============================
import './services/db.js';
import { isLicenseActive } from './services/licenseStore.js';
import { translate } from './utils/translate.js';

// USER LANGUAGE SYSTEM
import {
  setUserLang,
  getUserLang,
  hasUserLang
} from './utils/userLang.js';

// LANGUAGE UI
import {
  buildLanguageGroupMenu,
  buildLanguageMenu
} from './services/languagePrompt.js';

// ==============================
// CLIENT
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// ==============================
// LOAD COMMANDS
// ==============================
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const cmd = await import(`./commands/${file}`);
    if (cmd?.default?.data?.name) {
      client.commands.set(cmd.default.data.name, cmd.default);
    }
  } catch (err) {
    console.log(`❌ Command load error ${file}:`, err);
  }
}

// ==============================
// REGISTER COMMANDS
// ==============================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  {
    body: client.commands.map(c => c.data.toJSON())
  }
);

console.log("✅ Commands registered");

// ==============================
// READY EVENT
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// GUILD JOIN → LANGUAGE PROMPT
// ==============================
client.on('guildMemberAdd', async (member) => {
  try {
    if (hasUserLang(member.guild.id, member.id)) return;

    const channel = member.guild.systemChannel;
    if (!channel) return;

    await channel.send({
      content: `👋 Welcome ${member.user.username}!\nPlease select your language region:`,
      components: [buildLanguageGroupMenu(member.id)]
    });

  } catch (err) {
    console.log(err);
  }
});

// ==============================
// MESSAGE CREATE (FREE + PREMIUM SYSTEM)
// ==============================
const cooldown = new Map();

client.on('messageCreate', async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const premium = await isLicenseActive(message.guild.id);

    // ==============================
    // 🆓 FREE MODE
    // ==============================
    if (!premium) {

      if (!message.content.startsWith('!t ')) return;

      const key = `${message.guild.id}-${message.channel.id}`;
      const now = Date.now();

      const last = cooldown.get(key);
      if (last && now - last < 5000) return;

      cooldown.set(key, now);

      const text = message.content.slice(3).trim();
      if (!text) return;

      const result = await translate(text, 'EN');
      if (!result) return;

      return message.reply(`🌍 ${result.text}`);
    }

    // ==============================
    // 💎 PREMIUM MODE (CHANNEL SYSTEM)
    // ==============================
    const channelName = message.channel.name;

    // prevent loops in language channels
    if (channelName.includes('chat-')) return;

    const members = await message.guild.members.fetch();

    for (const [id, member] of members) {
      if (member.user.bot) continue;

      const lang = getUserLang(message.guild.id, id);
      if (!lang) continue;

      const result = await translate(message.content, lang);
      if (!result) continue;

      const targetChannel = message.guild.channels.cache.find(
        c => c.name === `chat-${lang.toLowerCase()}`
      );

      if (!targetChannel) continue;

      await targetChannel.send(`💬 ${result.text}`);
    }

  } catch (err) {
    console.log('Message error:', err);
  }
});

// ==============================
// INTERACTIONS (COMMANDS + DROPDOWNS)
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {

    // ==============================
    // LANGUAGE GROUP SELECT
    // ==============================
    if (interaction.isStringSelectMenu()) {

      // STEP 1
      if (interaction.customId.startsWith('langgroup_')) {
        const userId = interaction.customId.split('_')[1];

        if (interaction.user.id !== userId) {
          return interaction.reply({ content: "❌ Not your menu", ephemeral: true });
        }

        const group = interaction.values[0];

        return interaction.update({
          content: `🌍 Select your language:`,
          components: [buildLanguageMenu(userId, group)]
        });
      }

      // STEP 2
      if (interaction.customId.startsWith('setlang_')) {
        const userId = interaction.customId.split('_')[1];

        if (interaction.user.id !== userId) {
          return interaction.reply({ content: "❌ Not your menu", ephemeral: true });
        }

        const lang = interaction.values[0];

        setUserLang(interaction.guild.id, interaction.user.id, lang);

        return interaction.update({
          content: `✅ Language set to **${lang}**`,
          components: []
        });
      }
    }

    // ==============================
    // SLASH COMMANDS
    // ==============================
    if (interaction.isChatInputCommand()) {

      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);
    }

  } catch (err) {
    console.log('Interaction error:', err);
  }
});

// ==============================
// LOGIN
// ==============================
client.login(process.env.TOKEN);
