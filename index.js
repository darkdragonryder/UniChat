import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} from 'discord.js';

import fs from 'fs';

import { translate } from './utils/translate.js';
import { getGuildConfig } from './utils/guildConfig.js';

// =====================
// SERVICES
// =====================
import { applyPremiumExpiry } from './services/premiumService.js';
import { redeemReferralCode } from './services/referralService.js';
import { updateLeaderboard, getTopReferrer } from './services/leaderboardService.js';
import { updateReferralRole } from './services/roleService.js';

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
// LOAD COMMANDS (SAFE)
// =====================
const commandFiles = fs.existsSync('./commands')
  ? fs.readdirSync('./commands').filter(f => f.endsWith('.js'))
  : [];

for (const file of commandFiles) {
  try {
    const cmd = await import(`./commands/${file}`);

    if (!cmd?.default?.data?.name) {
      console.log(`⚠️ Invalid command file: ${file}`);
      continue;
    }

    client.commands.set(cmd.default.data.name, cmd.default);

  } catch (err) {
    console.log(`❌ Failed loading command ${file}:`, err);
  }
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

  const serviceFiles = fs.existsSync('./services')
    ? fs.readdirSync('./services')
    : [];

  console.log("📁 SERVICES CHECK:", serviceFiles);

  // 🔥 SAFE ROLE SYNC ON START
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = getGuildConfig(guild.id);
      const lb = config.referrals?.leaderboard || {};

      await updateReferralRole(guild, lb);

    } catch (err) {
      console.log("Role sync error:", err);
    }
  }
});

// =====================
// SAFE CONFIG WRAPPER
// =====================
function safeConfig(guildId) {
  try {
    let config = getGuildConfig(guildId);
    return applyPremiumExpiry(config);
  } catch (err) {
    console.log("Config error:", err);
    return null;
  }
}

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {
  try {

    // =====================
    // SLASH COMMANDS
    // =====================
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);

      // REFERRAL COMMANDS ONLY
      if (interaction.commandName.includes('referral')) {
        const guildId = interaction.guild.id;

        await updateLeaderboard(guildId);

        const config = getGuildConfig(guildId);
        const lb = config.referrals?.leaderboard || {};

        await updateReferralRole(interaction.guild, lb);

        const top = getTopReferrer(guildId);
        console.log("🏆 Top referrer:", top);
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

      const messageId = interaction.customId.split('_')[1];

      const message = await interaction.channel.messages
        .fetch(messageId)
        .catch(() => null);

      if (!message?.content) return;

      const config = safeConfig(interaction.guild.id);
      if (!config) return;

      const userLang = config.languages?.[interaction.user.id];

      const result = await translate(message.content, userLang);
      const text = result?.text || result;

      return interaction.reply({
        content: `🌍 Translation (${userLang || 'auto'}):\n${text}`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log("Interaction error:", err);
  }
});

client.login(process.env.TOKEN);
