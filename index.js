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
  // CONTEXT MENU → BUTTON
  // ---------------------
  if (interaction.isMessageContextMenuCommand()) {

    if (interaction.commandName !== 'Translate Message') return;

    const message = interaction.targetMessage;
    const config = getGuildConfig(interaction.guild.id);

    const userId = interaction.user.id;
    const userLang = config.languages?.[userId];

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

  // ---------------------
  // BUTTON HANDLER
  // ---------------------
  if (interaction.isButton()) {

    // ---------------------
    // DISMISS BUTTON
    // ---------------------
    if (interaction.customId === 'dismiss_translation') {
      return interaction.update({
        content: '🧹 Translation closed.',
        components: []
      });
    }

    // ---------------------
    // TRANSLATE BUTTON
    // ---------------------
    if (!interaction.customId.startsWith('translate_')) return;

    const messageId = interaction.customId.split('_')[1];

    const message = await interaction.channel.messages.fetch(messageId)
      .catch(() => null);

    if (!message || !message.content) {
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

    const translated = result.text || result;
    const detected = result.detected || null;

    return interaction.reply({
      content:
        `🌍 **Translation (${userLang})**\n` +
        `${detected ? `🧠 Detected: ${getFlag(detected)} ${detected}\n\n` : ''}` +
        `${translated}`,
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
