import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';

import fs from 'fs';
import { translate } from './utils/translate.js';
import { getGuildConfig, saveGuildConfig } from './utils/guildConfig.js';

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
        type: 3 // MESSAGE CONTEXT MENU
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

    if (interaction.commandName === 'Translate Message') {

      const message = interaction.targetMessage;
      const config = getGuildConfig(interaction.guild.id);

      const userId = interaction.user.id;

      // No language → ask user
      if (!config.languages[userId]) {

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`set_language_${message.id}`)
          .setPlaceholder('🌍 Select your language')
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('🇬🇧 English').setValue('en'),
            new StringSelectMenuOptionBuilder().setLabel('🇫🇷 French').setValue('fr'),
            new StringSelectMenuOptionBuilder().setLabel('🇪🇸 Spanish').setValue('es'),
            new StringSelectMenuOptionBuilder().setLabel('🇩🇪 German').setValue('de'),
            new StringSelectMenuOptionBuilder().setLabel('🇮🇹 Italian').setValue('it'),
            new StringSelectMenuOptionBuilder().setLabel('🇵🇹 Portuguese').setValue('pt')
          );

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: '🌍 Please select your language:',
          components: [row],
          ephemeral: true
        });
      }

      // Translate immediately
      const userLang = config.languages[userId];

      const translated = await translate(message.content, userLang);

      await interaction.channel.send(
        `🌍 **Translation (${userLang})**:\n${translated}`
      );

      return interaction.reply({
        content: '✅ Translated',
        ephemeral: true
      });
    }
  }

  // ---------------------
  // LANGUAGE SELECT MENU
  // ---------------------
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId.startsWith('set_language_')) {

      // IMPORTANT FIX → prevents timeout
      await interaction.deferReply({ ephemeral: true });

      const messageId = interaction.customId.split('_')[2];
      const lang = interaction.values[0];

      const config = getGuildConfig(interaction.guild.id);

      config.languages = config.languages || {};
      config.languages[interaction.user.id] = lang;

      saveGuildConfig(interaction.guild.id, config);

      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);

      if (!message) {
        return interaction.editReply('❌ Message not found');
      }

      const translated = await translate(message.content, lang);

      // Post publicly in channel
      await interaction.channel.send(
        `🌍 **Translation (${lang})**:\n${translated}`
      );

      return interaction.editReply('✅ Language saved & translated');
    }
  }

});

client.login(process.env.TOKEN);
