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

// 🔥 CORE (FIXED IMPORT PATH + CASE)
import { isPremium } from './services/unichatCore.js';

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
const commandFiles = fs.existsSync('./commands')
  ? fs.readdirSync('./commands').filter(f => f.endsWith('.js'))
  : [];

for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  if (cmd?.default?.data?.name) {
    client.commands.set(cmd.default.data.name, cmd.default);
  }
}

// ==============================
// REGISTER COMMANDS
// ==============================
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

console.log("✅ Bot Ready");

// ==============================
// READY
// ==============================
client.once('ready', async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// ==============================
// MESSAGE CREATE (🔥 FREE + PREMIUM TRANSLATION HOOK)
// ==============================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const config = getGuildConfig(message.guild.id);
  if (!config) return;

  // 🔹 PREMIUM AUTO TRANSLATE (ONLY IF ENABLED)
  if (isPremium(message.guild.id)) {

    const targetLang = config.autoTranslateLang || 'en';

    try {
      const result = await translate(message.content, targetLang);

      return message.reply({
        content: `🌍 ${result?.text || result}`,
        allowedMentions: { repliedUser: false }
      });

    } catch (err) {
      console.log("Premium translate error:", err);
    }
  }
});

// ==============================
// INTERACTIONS
// ==============================
client.on('interactionCreate', async (interaction) => {
  try {

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('translate_')) {

        const msgId = interaction.customId.split('_')[1];

        const msg = await interaction.channel.messages.fetch(msgId).catch(() => null);
        if (!msg) return;

        const config = getGuildConfig(interaction.guild.id);
        const lang = config?.languages?.[interaction.user.id] || 'en';

        const result = await translate(msg.content, lang);

        return interaction.reply({
          content: `🌍 ${result?.text || result}`,
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.log("Interaction error:", err);
  }
});

client.login(process.env.TOKEN);
