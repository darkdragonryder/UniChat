import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

import { getGuildSetup, saveGuildSetup } from '../services/guildSetupStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-translator')
    .setDescription('Setup UniChat translator system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    const existing = await getGuildSetup(guild.id);

    if (existing?.enabled) {
      return interaction.editReply('⚠️ Already setup');
    }

    const languages = [
      { name: 'English', code: 'en' },
      { name: 'French', code: 'fr' },
      { name: 'Spanish', code: 'es' },
      { name: 'German', code: 'de' },
      { name: 'Japanese', code: 'ja' },
      { name: 'Korean', code: 'ko' }
    ];

    const roles = [];
    const channels = [];

    const sourceChannel = await guild.channels.create({
      name: 'general-chat',
      type: ChannelType.GuildText
    });

    for (const lang of languages) {

      const role = await guild.roles.create({
        name: `Lang-${lang.name}`
      });

      const channel = await guild.channels.create({
        name: `chat-${lang.code}`,
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

      roles.push({ lang: lang.code, roleId: role.id });
      channels.push({ lang: lang.code, channelId: channel.id });
    }

    await saveGuildSetup(guild.id, {
      sourceChannelId: sourceChannel.id,
      roles,
      channels
    });

    return interaction.editReply('✅ UniChat setup complete');
  }
};
