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

// =====================================================
// 🏆 ROLE CONFIG
// =====================================================
const REFERRAL_ROLE_NAME = '🏆 Referral Champion';

// =====================================================
// ROLE HANDLER
// =====================================================
async function updateReferralRole(guild, config) {
  try {
    const lb = config?.referrals?.leaderboard || {};
    const entries = Object.entries(lb);

    if (entries.length === 0) return;

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const topUserId = sorted[0][0];

    let role = guild.roles.cache.find(r => r.name === REFERRAL_ROLE_NAME);

    if (!role) {
      role = await guild.roles.create({
        name: REFERRAL_ROLE_NAME,
        color: 0xFFD700,
        reason: 'Referral leaderboard reward'
      });
    }

    const members = await guild.members.fetch();

    for (const member of members.values()) {
      if (member.roles.cache.has(role.id) && member.id !== topUserId) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    const topMember = await guild.members.fetch(topUserId).catch(() => null);

    if (topMember && !topMember.roles.cache.has(role.id)) {
      await topMember.roles.add(role).catch(() => {});
    }

  } catch (err) {
    console.log("❌ Role update error:", err);
  }
}

// =====================================================
// READY EVENT
// =====================================================
client.once('ready', () => {
  console.log(`🚀 UniChat LIVE: ${client.user.tag}`);
});

// =====================================================
// PREMIUM EXPIRY SYSTEM
// =====================================================
function applyPremiumExpiry(config) {
  if (!config.premium || !config.premiumExpiry) return config;

  if (Date.now() > config.premiumExpiry) {
    config.premium = false;
    config.mode = 'reaction';
    config.premiumStart = null;
    config.premiumExpiry = null;
  }

  return config;
}

// =====================================================
// REFERRAL REWARD SYSTEM (FIXED HOOK)
// =====================================================
async function checkReferralRewards(guildId, ownerId, totalUses) {
  const config = getGuildConfig(guildId);

  if (!config.referrals) return;

  if (!config.referrals.rewardsGiven) {
    config.referrals.rewardsGiven = {};
  }

  if (!config.referrals.rewardsGiven[ownerId]) {
    config.referrals.rewardsGiven[ownerId] = [];
  }

  const rewards = config.referrals.rewardsGiven[ownerId];

  let reward = null;

  if (totalUses >= 25 && !rewards.includes('lifetime')) {
    reward = 'lifetime';
    rewards.push('lifetime');
  } else if (totalUses >= 10 && !rewards.includes('month')) {
    reward = 'month';
    rewards.push('month');
  } else if (totalUses >= 5 && !rewards.includes('week')) {
    reward = 'week';
    rewards.push('week');
  }

  if (!reward) return;

  const now = Date.now();

  if (reward === 'week') {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = now + 7 * 24 * 60 * 60 * 1000;
  }

  if (reward === 'month') {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = now + 30 * 24 * 60 * 60 * 1000;
  }

  if (reward === 'lifetime') {
    config.premium = true;
    config.mode = 'auto';
    config.premiumStart = now;
    config.premiumExpiry = null;
  }

  saveGuildConfig(guildId, config);

  try {
    const user = await client.users.fetch(ownerId);

    if (user) {
      await user.send(
        `🎉 Referral Reward Unlocked!\n` +
        `You reached ${totalUses} referrals!\n` +
        `Reward: ${reward.toUpperCase()} PREMIUM`
      );
    }
  } catch {}
}

// =====================================================
// SAFE CONFIG
// =====================================================
function safeConfig(guildId) {
  let config = getGuildConfig(guildId);
  config = applyPremiumExpiry(config);
  return config;
}

// =====================================================
// SMART FILTER
// =====================================================
function shouldSkip(text, lang) {
  if (!text) return true;
  const simpleLatin = /^[a-z0-9\s.,!?'"()-]+$/i.test(text);
  return lang === 'en' && simpleLatin;
}

// =====================================================
// MESSAGE EVENTS
// =====================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const config = safeConfig(message.guild.id);
  if (!config.premium || config.mode !== 'auto') return;

  for (const [userId, lang] of Object.entries(config.languages || {})) {
    if (!lang || lang === 'en') continue;
    if (shouldSkip(message.content, lang)) continue;

    try {
      const result = await translate(message.content, lang);
      const text = result?.text || result;

      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) continue;

      await user.send(`🌍 Auto Translation (${lang})\n\n${text}`);
    } catch {}
  }
});

// =====================================================
// REACTION MODE
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
    if (!userLang) return user.send("❌ Set your language first");

    const result = await translate(message.content, userLang);
    const text = result?.text || result;

    await message.channel.send(
      `🌍 Translation for ${user.username} (${userLang}):\n${text}`
    );

  } catch {}
});

// =====================================================
// INTERACTIONS
// =====================================================
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    const result = await cmd.execute(interaction);

    // ✅ FIXED HOOK (ALL REFERRAL COMMANDS)
    if (interaction.commandName.includes('referral') && result?.success) {
      await checkReferralRewards(
        interaction.guild.id,
        result.ownerId,
        result.totalUses
      );

      const config = getGuildConfig(interaction.guild.id);
      await updateReferralRole(interaction.guild, config);
    }

    return;
  }

  if (interaction.isMessageContextMenuCommand()) {
    const message = interaction.targetMessage;
    const config = safeConfig(interaction.guild.id);

    const userLang = config.languages?.[interaction.user.id];

    if (!userLang) {
      return interaction.reply({
        content: '❌ Please set your language first',
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
        content: '🧹 Closed',
        components: []
      });
    }

    if (!interaction.customId.startsWith('translate_')) return;

    const message = await interaction.channel.messages.fetch(
      interaction.customId.split('_')[1]
    ).catch(() => null);

    if (!message?.content) return;

    const config = safeConfig(interaction.guild.id);
    const userLang = config.languages?.[interaction.user.id];

    const result = await translate(message.content, userLang);
    const text = result?.text || result;

    return interaction.reply({
      content: `🌍 Translation (${userLang}):\n${text}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
