import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import fs from 'fs';
import { translate } from './utils/translate.js';
import { getGuildConfig } from './utils/guildConfig.js';
import { getFlag } from './utils/flags.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

client.commands = new Collection();

// =====================
// LOAD COMMANDS
// =====================
for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = await import(`./commands/${file}`);
  client.commands.set(cmd.default.data.name, cmd.default);
}

// =====================
// REGISTER COMMANDS
// =====================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  {
    body: [
      ...client.commands.map(c => c.data.toJSON()),
      {
        name: 'Translate Message',
        type: 3
      }
    ]
  }
);

console.log("✅ Commands registered");

// =====================
// READY EVENT
// =====================
client.once('ready', () => {
  console.log(`🚀 UniChat LIVE: ${client.user.tag}`);
});


// =====================================================
// 🧠 SMART FILTER (PREVENT SPAM)
// =====================================================
function shouldSkip(text, lang) {
  if (!text) return true;

  const simpleLatin = /^[a-z0-9\s.,!?'"()-]+$/i.test(text);

  if (lang === 'en' && simpleLatin) return true;

  return false;
}


// =====================================================
// 💎 PREMIUM AUTO TRANSLATION (DM SYSTEM)
// =====================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const config = getGuildConfig(message.guild.id);

  if (!config.premium || config.mode !== 'auto') return;

  const languages = config.languages || {};

  for (const [userId, lang] of Object.entries(languages)) {

    if (!lang || lang === 'en') continue;
    if (shouldSkip(message.content, lang)) continue;

    try {
      const result = await translate(message.content, lang);

      const text = result?.text || result;
      if (!text) continue;

      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) continue;

      await user.send(
        `🌍 **Auto Translation (${lang})**\n\n${text}`
      );

    } catch (err) {
      console.log("❌ DM failed:", userId);
    }
  }
});


// =====================================================
// 🆓 FREE MODE (REACTION TRANSLATION)
// =====================================================
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    if (!message?.content) return;

    const config = getGuildConfig(message.guild?.id);
    if (!config) return;

    if (reaction.emoji.name !== '🌍') return;

    const userLang = config.languages?.[user.id];

    if (!userLang) {
      return user.send("❌ Set your language first using /setlang");
    }

    const result = await translate(message.content, userLang);
    const text = result?.text || result;

    await message.channel.send(
      `🌍 **Translation for ${user.username} (${userLang})**:\n${text}`
    );

  } catch (err) {
    console.log("❌ Reaction translation error:", err);
  }
});


// =====================================================
// INTERACTIONS (COMMANDS + BUTTONS)
// =====================================================
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    return cmd.execute(interaction);
  }

  // CONTEXT MENU
  if (interaction.isMessageContextMenuCommand()) {

    if (interaction.commandName !== 'Translate Message') return;

    const message = interaction.targetMessage;
    const config = getGuildConfig(interaction.guild.id);

    const userLang = config.languages?.[interaction.user.id];

    if (!userLang) {
      return interaction.reply({
        content: '❌ Please set your language first using /setlang',
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`translate_${message.id}`)
        .setLabel('🌍 Translate')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: 'Click below to translate this message:',
      components: [row],
      ephemeral: true
    });
  }

  // BUTTON HANDLER
  if (interaction.isButton()) {

    if (interaction.customId === 'dismiss_translation') {
      return interaction.update({
        content: '🧹 Translation closed.',
        components: []
      });
    }

    if (!interaction.customId.startsWith('translate_')) return;

    const messageId = interaction.customId.split('_')[1];

    const message = await interaction.channel.messages.fetch(messageId)
      .catch(() => null);

    if (!message?.content) {
      return interaction.reply({
        content: '❌ Message not found',
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);
    const userLang = config.languages?.[interaction.user.id];

    if (!userLang) {
      return interaction.reply({
        content: '❌ Please set your language using /setlang',
        ephemeral: true
      });
    }

    const result = await translate(message.content, userLang);
    const text = result?.text || result;
    const detected = result?.detected || null;

    return interaction.reply({
      content:
        `🌍 **Translation (${userLang})**\n` +
        `${detected ? `🧠 Detected: ${getFlag(detected)} ${detected}\n\n` : ''}` +
        `${text}`,
      ephemeral: true,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('dismiss_translation')
            .setLabel('❌ Dismiss')
            .setStyle(ButtonStyle.Secondary)
        )
      ]
    });
  }
});

client.login(process.env.TOKEN);
