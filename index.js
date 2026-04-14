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
import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';
import { getFlag } from './utils/flags.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER']
});

client.commands = new Collection();

// =====================
// INVITE CACHE
// =====================
const inviteCache = new Map();

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
      { name: 'Translate Message', type: 3 }
    ]
  }
);

console.log("✅ Commands registered");

// =====================
// READY EVENT
// =====================
client.once('ready', async () => {
  console.log(`🚀 UniChat LIVE: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, invites);
    } catch (err) {
      console.log("❌ Invite fetch failed:", guild.id);
    }
  }
});

// =====================================================
// 💎 PREMIUM EXPIRY SYSTEM
// =====================================================
function applyPremiumExpiry(config) {
  if (!config.premium || !config.premiumExpiry) return config;

  const now = Date.now();

  if (now > config.premiumExpiry) {
    config.premium = false;
    config.mode = 'reaction';
    config.premiumStart = null;
    config.premiumExpiry = null;
  }

  return config;
}

// =====================================================
// 🏆 LEADERBOARD SYSTEM (90 DAY CYCLE)
// =====================================================
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

function updateLeaderboard(config, guildId) {
  if (!config.inviteLeaderboard) {
    config.inviteLeaderboard = {
      cycleStart: Date.now(),
      users: {}
    };
  }

  const lb = config.inviteLeaderboard;

  if (Date.now() - lb.cycleStart > NINETY_DAYS) {

    const sorted = Object.entries(lb.users || {})
      .sort((a, b) => b[1] - a[1]);

    const top = sorted[0];

    if (top) {
      const [winnerId] = top;

      const month = 30 * 24 * 60 * 60 * 1000;

      config.premium = true;
      config.mode = 'auto';
      config.premiumStart = Date.now();
      config.premiumExpiry = Date.now() + month;

      client.users.fetch(winnerId).then(user => {
        if (user) {
          user.send("🏆 You won the invite leaderboard! You’ve been granted 1 month FREE premium!");
        }
      }).catch(() => {});
    }

    config.inviteLeaderboard = {
      cycleStart: Date.now(),
      users: {}
    };
  }

  return config;
}

// =====================================================
// SAFE CONFIG WRAPPER
// =====================================================
function safeConfig(guildId) {
  let config = getGuildConfig(guildId);

  config = applyPremiumExpiry(config);
  config = updateLeaderboard(config, guildId);

  return config;
}

// =====================================================
// SMART FILTER
// =====================================================
function shouldSkip(text, lang) {
  if (!text) return true;

  const simpleLatin = /^[a-z0-9\s.,!?'"()-]+$/i.test(text);

  if (lang === 'en' && simpleLatin) return true;

  return false;
}

// =====================================================
// 💎 PREMIUM AUTO MODE (DM)
// =====================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const config = safeConfig(message.guild.id);

  if (!config.premium || config.mode !== 'auto') return;

  const languages = config.languages || {};

  for (const [userId, lang] of Object.entries(languages)) {

    if (!lang || lang === 'en') continue;
    if (shouldSkip(message.content, lang)) continue;

    try {
      const result = await translate(message.content, lang);
      const text = result?.text || result;

      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) continue;

      await user.send(`🌍 **Auto Translation (${lang})**\n\n${text}`);

    } catch (err) {
      console.log("❌ DM failed:", userId);
    }
  }
});

// =====================================================
// 🆓 REACTION MODE (FREE)
// =====================================================
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    if (!message?.content) return;

    const config = safeConfig(message.guild?.id);

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
    console.log("❌ Reaction error:", err);
  }
});

// =====================================================
// INVITE TRACKING SYSTEM
// =====================================================
client.on('guildMemberAdd', async (member) => {
  try {
    const oldInvites = inviteCache.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();

    inviteCache.set(member.guild.id, newInvites);

    const config = safeConfig(member.guild.id);

    let usedInvite = null;

    for (const invite of newInvites.values()) {
      const old = oldInvites?.get(invite.code);

      if (old && invite.uses > old.uses) {
        usedInvite = invite;
        break;
      }
    }

    if (!usedInvite?.inviter) return;

    const inviterId = usedInvite.inviter.id;

    if (!config.inviteLeaderboard.users[inviterId]) {
      config.inviteLeaderboard.users[inviterId] = 0;
    }

    config.inviteLeaderboard.users[inviterId] += 1;

    saveGuildConfig(member.guild.id, config);

    console.log(`🏆 Invite tracked: ${inviterId}`);

  } catch (err) {
    console.log("❌ Invite tracking error:", err);
  }
});

// =====================================================
// INTERACTIONS
// =====================================================
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    return cmd.execute(interaction);
  }

  if (interaction.isMessageContextMenuCommand()) {

    const message = interaction.targetMessage;
    const config = safeConfig(interaction.guild.id);

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

    const config = safeConfig(interaction.guild.id);
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
