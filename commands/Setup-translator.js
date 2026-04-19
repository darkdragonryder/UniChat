import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

import {
  getGuildSetup,
  saveGuildSetup
} from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-translator')
    .setDescription('Setup multilingual system (Premium)')
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

    const languages = [
      { name: 'English', code: 'en' },
      { name: 'French', code: 'fr' },
      { name: 'Spanish', code: 'es' },
      { name: 'German', code: 'de' },
      { name: 'Japanese', code: 'ja' },
      { name: 'Korean', code: 'ko' },
      { name: 'Chinese', code: 'zh' }
    ];

    const roleIds = [];
    const channelIds = [];

    try {

      for (const lang of languages) {

        // ROLE
        let role = guild.roles.cache.find(r =>
          r.name === `🌍 ${lang.name}`
        );

        if (!role) {
          role = await guild.roles.create({
            name: `🌍 ${lang.name}`,
            reason: 'Translator system role'
          });
        }

        roleIds.push({
          lang: lang.code,
          roleId: role.id
        });

        // CHANNEL
        const channelName = `chat-${lang.code}`;

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
                deny: ['ViewChannel']
              },
              {
                id: role.id,
                allow: ['ViewChannel', 'SendMessages']
              }
            ]
          });
        }

        channelIds.push({
          lang: lang.code,
          channelId: channel.id
        });
      }

      // ==============================
      // SAVE TO DATABASE
      // ==============================
      await saveGuildSetup(guild.id, {
        roles: roleIds,
        channels: channelIds
      });

      return interaction.editReply(
        "✅ Translator system setup complete & saved."
      );

    } catch (err) {
      console.log(err);
      return interaction.editReply("❌ Setup failed");
    }
  }
};
