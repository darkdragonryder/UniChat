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

// GUILD SETUP CACHE (AUTO LOAD SYSTEM)
import { loadGuildCache, getCachedGuildSetup } from './services/guildCache.js';

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
// READY EVENT (AUTO LOAD HERE)
// ==============================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);

  // AUTO LOAD ALL GUILD SETUPS
  await loadGuildCache(client);

  console.log("✅ Guild setup cache loaded");
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
// MESSAGE SYSTEM (NO guild.fetch - CACHE BASED)
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
    // 💎 PREMIUM MODE (CACHE BASED ROUTING)
    // ==============================
    if (message.channel.name.startsWith('chat-')) return;

    const setup = getCachedGuildSetup(message.guild.id);
    if (!setup) return;

    const guild = message.guild;

    const langRoles = guild.roles.cache.filter(r =>
      r.name.startsWith('🌍')
    );

    for (const role of langRoles.values()) {

      const lang = role.name
        .replace('🌍', '')
        .trim()
        .toLowerCase();

      const channel = guild.channels.cache.find(
        c => c.name === `chat-${lang}`
      );

      if (!channel) continue;

      const result = await translate(message.content, lang);
      if (!result) continue;

      await channel.send(`💬 ${result.text}`);
    }

  } catch (err) {
    console.log('Message error:', err);
  }
});

// ==============================
// INTERACTIONS (FULL CONNECTED SYSTEM)
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {

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

      // STEP 2 LANGUAGE SELECT (ROLE CONNECTED)
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

        // ADD NEW ROLE
        const newRole = guild.roles.cache.find(r =>
          r.name.toLowerCase().includes(lang)
        );

        if (newRole) {
          await member.roles.add(newRole).catch(() => {});
        }

        setUserLang(guild.id, member.id, lang);

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
