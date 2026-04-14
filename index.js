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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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


// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async (interaction) => {

  // ---------------------
  // SLASH COMMANDS
  // ---------------------
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    return cmd.execute(interaction);
  }

  // ---------------------
  // CONTEXT MENU TRANSLATE
  // ---------------------
  if (interaction.isMessageContextMenuCommand()) {

    if (interaction.commandName !== 'Translate Message') return;

    const message = interaction.targetMessage;
    const config = getGuildConfig(interaction.guild.id);

    const userId = interaction.user.id;
    const userLang = config.languages?.[userId];

    // MUST set language first
    if (!userLang) {
      return interaction.reply({
        content: '❌ Please set your language first using /setlang',
        ephemeral: true
      });
    }

    if (!message.content || message.content.trim().length === 0) {
      return interaction.reply({
        content: '❌ Nothing to translate',
        ephemeral: true
      });
    }

    const translated = await translate(message.content, userLang);

    return interaction.reply({
      content: `🌍 **Translation (${userLang})**:\n${translated}`,
      ephemeral: true
    });
  }

});

client.login(process.env.TOKEN);
