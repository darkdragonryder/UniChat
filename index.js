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

  // 📁 SERVICES FOLDER CHECK (RAILWAY DEBUG)
  const fsMod = await import('fs');

  const serviceFiles = fsMod.default.existsSync('./services')
    ? fsMod.default.readdirSync('./services')
    : null;

  console.log("📁 SERVICES FOLDER CHECK:", serviceFiles || "MISSING");

  // 🔥 FULL ROLE SYNC ON START
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
// SAFE CONFIG
// =====================
function safeConfig(guildId) {
  let config = getGuildConfig(guildId);
  return applyPremiumExpiry(config);
}

// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    await cmd.execute(interaction);

    if (interaction.commandName.includes('referral')) {
      const guild = interaction.guild;

      await updateLeaderboard(guild.id);

      const config = getGuildConfig(guild.id);
      const lb = config.referrals?.leaderboard || {};

      await updateReferralRole(guild, lb);

      const top = getTopReferrer(guild.id);
      console.log("🏆 Top referrer:", top);
    }

    return;
  }

  if (interaction.isButton()) {

    if (interaction.customId === 'dismiss_translation') {
      return interaction.update({
        content: '🧹 Closed',
        components: []
      });
    }

    if (!interaction.customId.startsWith('translate_')) return;

    const message = await interaction.channel.messages
      .fetch(interaction.customId.split('_')[1])
      .catch(() => null);

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

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === 'referral-redeem'
  ) {
    const code = interaction.options.getString('code');

    const result = redeemReferralCode(
      interaction.guild.id,
      interaction.user.id,
      code
    );

    if (!result.ok) {
      return interaction.reply({
        content: `❌ ${result.reason}`,
        ephemeral: true
      });
    }

    await updateLeaderboard(interaction.guild.id);

    const config = getGuildConfig(interaction.guild.id);
    const lb = config.referrals?.leaderboard || {};

    await updateReferralRole(interaction.guild, lb);

    const top = getTopReferrer(interaction.guild.id);
    console.log("🏆 Updated top referrer:", top);

    return interaction.reply({
      content: `🎉 Referral applied successfully!`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
