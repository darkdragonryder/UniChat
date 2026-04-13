console.log("TOKEN VALUE:", process.env.TOKEN);
console.log("TOKEN TYPE:", typeof process.env.TOKEN);

import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes } from 'discord.js';
import fs from 'fs';

import { getUserLanguage } from './utils/language.js';
import { translateText } from './utils/translator.js';
import { getLinkedChannels } from './utils/links.js';
import { hasAccess } from './utils/access.js';
import { getCache, setCache } from './utils/cache.js';
import { queue } from './utils/queue.js';
import { track } from './utils/stats.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();

// Load commands
for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = await import(`./commands/${file}`);
  client.commands.set(cmd.default.data.name, cmd.default);
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: client.commands.map(c => c.data.toJSON()) }
);

console.log("✅ Commands registered");

client.once('ready', () => {
  console.log(`🚀 UniChat v4 LIVE: ${client.user.tag}`);
});

// Command handler
client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  await cmd.execute(i);
});

// Message handler
client.on('messageCreate', async msg => {
  if (msg.author.bot || !msg.guild) return;
  if (!(await hasAccess(msg))) return;

  queue(async () => {
    const members = msg.channel.members.filter(m => !m.user.bot);
    const langMap = {};

    for (const [_, member] of members) {
      const lang = (await getUserLanguage(member.id)) || process.env.DEFAULT_LANG;
      if (!langMap[lang]) langMap[lang] = [];
      langMap[lang].push(member.user.username);
    }

    for (const lang of Object.keys(langMap)) {
      const key = msg.content + "_" + lang;
      let translated = getCache(key);

      if (!translated) {
        translated = await translateText(msg.content, lang);
        setCache(key, translated);
      }

      if (!translated || translated === msg.content) continue;

      track(lang, msg.author.id);

      const embed = new EmbedBuilder()
        .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
        .setDescription(translated)
        .setFooter({ text: `🌐 ${lang.toUpperCase()}` });

      msg.channel.send({ embeds: [embed] });
    }

    // Linked channels
    for (const ch of getLinkedChannels(msg.channel.id)) {
      const channel = client.channels.cache.get(ch);
      if (!channel) continue;

      const translated = await translateText(msg.content, process.env.DEFAULT_LANG);

      const embed = new EmbedBuilder()
        .setDescription(translated)
        .setFooter({ text: `🔗 Linked from ${msg.channel.name}` });

      channel.send({ embeds: [embed] });
    }
  });
});

// Reaction translate
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot || reaction.emoji.name !== "🌐") return;

  const lang = await getUserLanguage(user.id) || process.env.DEFAULT_LANG;
  const translated = await translateText(reaction.message.content, lang);

  const embed = new EmbedBuilder()
    .setDescription(translated)
    .setFooter({ text: `🌐 ${lang.toUpperCase()} • ${user.username}` });

  reaction.message.channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);
