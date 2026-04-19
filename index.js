import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';

import fs from 'fs';

// ==============================
// CORE SYSTEMS
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
// READY
// ==============================
client.once('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// GUILD JOIN PROMPT
// ==============================
client.on('guildMemberAdd', async (member) => {
  try {
    if (hasUserLang(member.guild.id, member.id)) return;

    const channel = member.guild.systemChannel;
    if (!channel) return;

    await channel.send({
      content: `👋 Welcome ${member.user.username}!\nPlease select your language:`,
      components: [buildLanguageGroupMenu(member.id)]
    });

  } catch (err) {
    console.log(err);
  }
});

// ==============================
// MESSAGE SYSTEM (FREE + PREMIUM)
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
    // 💎 PREMIUM MODE
    // ==============================
    if (message.channel.name.startsWith('chat-')) return;

    const members = await message.guild.members.fetch();

    for (const [id, member] of members) {
      if (member.user.bot) continue;

      const lang = getUserLang(message.guild.id, id);
      if (!lang) continue;

      const result = await translate(message.content, lang);
      if (!result) continue;

      const channel = message.guild.channels.cache.find(
        c => c.name === `chat-${lang}`
      );

      if (channel) {
        await channel.send(`💬 ${result.text}`);
      }
    }

  } catch (err) {
    console.log('Message error:', err);
  }
});

// ==============================
// INTERACTIONS (FULL FIXED)
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {

    // ==============================
    // LANGUAGE SELECTOR (FULL CONNECTED FIX)
    // ==============================
    if (interaction.isStringSelectMenu()) {

      // STEP 1 GROUP
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

      // STEP 2 LANGUAGE SELECT (FULL ROLE SYSTEM CONNECTED)
      if (interaction.customId.startsWith('setlang_')) {
        const guild = interaction.guild;
        const userId = interaction.customId.split('_')[1];

        if (interaction.user.id !== userId) {
          return interaction.reply({ content: "❌ Not your menu", ephemeral: true });
        }

        const lang = interaction.values[0].toLowerCase();
        const member = await guild.members.fetch(interaction.user.id);

        // REMOVE OLD LANGUAGE ROLES
        const oldRoles = guild.roles.cache.filter(r =>
          r.name.startsWith('🌍')
        );

        for (const role of oldRoles.values()) {
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(() => {});
          }
        }

        // FIND NEW ROLE
        const newRole = guild.roles.cache.find(r =>
          r.name.toLowerCase().includes(lang)
        );

        if (!newRole) {
          return interaction.update({
            content: "❌ Language role missing. Run /setup-translator",
            components: []
          });
        }

        // ASSIGN ROLE
        await member.roles.add(newRole).catch(() => {});

        // SAVE USER LANGUAGE
        setUserLang(guild.id, member.id, lang);

        // FIND CHANNEL
        const channel = guild.channels.cache.find(
          c => c.name === `chat-${lang}`
        );

        return interaction.update({
          content:
            `✅ Language set to **${lang.toUpperCase()}**\n` +
            `📢 Channel: ${channel ? `#${channel.name}` : 'not found'}`,
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
