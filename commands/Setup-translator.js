import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField
} from 'discord.js';

import {
  getGuildSetup,
  saveGuildSetup
} from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-translator')
    .setDescription('Setup multilingual translation system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    // ==============================
    // CHECK IF ALREADY SETUP
    // ==============================
    const existing = await getGuildSetup(guild.id);

    if (existing?.enabled) {
      return interaction.editReply(
        "⚠️ Translator system already set up for this server."
      );
    }

    // ==============================
    // SUPPORTED LANGUAGES
    // ==============================
    const languages = [
      { name: 'English', code: 'en' },
      { name: 'French', code: 'fr' },
      { name: 'Spanish', code: 'es' },
      { name: 'German', code: 'de' },
      { name: 'Japanese', code: 'ja' },
      { name: 'Korean', code: 'ko' },
      { name: 'Chinese', code: 'zh' }
    ];

    const roleMap = [];
    const channelMap = [];

    try {

      // ==============================
      // SOURCE CHANNEL (ENGLISH BASE)
      // ==============================
      let sourceChannel = guild.channels.cache.find(
        c => c.name === 'general-chat'
      );

      if (!sourceChannel) {
        sourceChannel = await guild.channels.create({
          name: 'general-chat',
          type: ChannelType.GuildText
        });
      }

      // ==============================
      // CREATE LANGUAGES
      // ==============================
      for (const lang of languages) {

        // ------------------------------
        // CREATE ROLE
        // ------------------------------
        let role = guild.roles.cache.find(
          r => r.name === `Lang-${lang.name}`
        );

        if (!role) {
          role = await guild.roles.create({
            name: `Lang-${lang.name}`,
            reason: 'Translator system role'
          });
        }

        roleMap.push({
          lang: lang.code,
          roleId: role.id
        });

        // ------------------------------
        // CREATE CHANNEL
        // ------------------------------
        const channelName =
          lang.code === 'en'
            ? 'general-chat-en'
            : `general-chat-${lang.code}`;

        let channel = guild.channels.cache.find(
          c => c.name === channelName
        );

        if (!channel) {
          channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              {
                id: role.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory
                ]
              }
            ]
          });
        }

        channelMap.push({
          lang: lang.code,
          channelId: channel.id
        });
      }

      // ==============================
      // SAVE SYSTEM CONFIG
      // ==============================
      await saveGuildSetup(guild.id, {
        enabled: true,
        sourceChannelId: sourceChannel.id,
        roles: roleMap,
        channels: channelMap
      });

      // ==============================
      // SUCCESS MESSAGE
      // ==============================
      return interaction.editReply(`
✅ **Translator Setup Complete**

✔ Source channel: #general-chat  
✔ Language channels created  
✔ Roles assigned  
✔ Permissions configured  

⚠️ IMPORTANT:
- Move bot role ABOVE language roles
- Users will only see their language channel
- English is default system language

🌍 System is now active.
      `);

    } catch (err) {
      console.log(err);
      return interaction.editReply("❌ Setup failed. Check console logs.");
    }
  }
};
