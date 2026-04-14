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

// =====================
// SERVICES (NEW SYSTEM)
// =====================
import { applyPremiumExpiry } from './services/premiumService.js';
import { redeemReferralCode } from './services/referralService.js';
import { updateReferralBadges, updateTopReferrer } from './services/badgeService.js';

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

// =====================
// READY
// =====================
client.once('ready', async () => {
  console.log(`🚀 UniChat LIVE: ${client.user.tag}`);
});

// =====================
// SAFE CONFIG
// =====================
function safeConfig(guildId) {
  let config = getGuildConfig(guildId);

  config = applyPremiumExpiry(config);

  return config;
}

// =====================
// SMART FILTER
// =====================
function shouldSkip(text, lang) {
  if (!text) return true;
  const simpleLatin = /^[a-z0-9\s.,!?'"()-]+$/i.test(text);
  return lang === 'en' && simpleLatin;
}

// =====================
// MESSAGE TRANSLATION
// =====================
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

// =====================
// REACTIONS
// =====================
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

// =====================
// GUILD MEMBER JOIN (FUTURE HOOK)
// =====================
client.on('guildMemberAdd', async (member) => {
  try {
    // future invite tracking hook
  } catch {}
});

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    const result = await cmd.execute(interaction);

    // =====================
    // REFERRAL SYSTEM HOOK
    // =====================
    if (interaction.commandName.includes('referral')) {
      const guild = interaction.guild;

      const config = getGuildConfig(guild.id);

      await updateReferralBadges(client, guild);
      await updateTopReferrer(guild);
    }

    return;
  }

  // =====================
  // BUTTONS
  // =====================
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

  // =====================
  // REFERRAL REDEEM
  // =====================
  if (interaction.commandName === 'referral-redeem') {
    const code = interaction.options.getString('code');

    const result = redeemReferralCode(
      interaction.guild.id,
      code,
      interaction.guild.id
    );

    if (!result.ok) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    // update badges instantly
    await updateReferralBadges(client, interaction.guild);
    await updateTopReferrer(interaction.guild);

    return interaction.reply({
      content: `🎉 Referral applied successfully!`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
