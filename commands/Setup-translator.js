import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-translator')
    .setDescription('Setup full multilingual translation system (Premium)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    // ==============================
    // LANGUAGE CONFIG
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

    try {

      // ==============================
      // CREATE ROLE FOR EACH LANGUAGE
      // ==============================
      const roles = {};

      for (const lang of languages) {

        let role = guild.roles.cache.find(
          r => r.name === `🌍 ${lang.name}`
        );

        if (!role) {
          role = await guild.roles.create({
            name: `🌍 ${lang.name}`,
            reason: 'Translator system role'
          });
        }

        roles[lang.code] = role;
      }

      // ==============================
      // CREATE CHANNELS + PERMISSIONS
      // ==============================
      for (const lang of languages) {

        const channelName = `chat-${lang.code}`;

        let channel = guild.channels.cache.find(
          c => c.name === channelName
        );

        if (!channel) {

          channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            topic: `🌍 ${lang.name} translation channel`,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: ['ViewChannel']
              },
              {
                id: roles[lang.code].id,
                allow: [
                  'ViewChannel',
                  'SendMessages',
                  'ReadMessageHistory'
                ]
              }
            ]
          });
        } else {
          // update permissions if channel already exists
          await channel.permissionOverwrites.edit(guild.id, {
            ViewChannel: false
          });

          await channel.permissionOverwrites.edit(
            roles[lang.code].id,
            {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true
            }
          );
        }
      }

      // ==============================
      // SUCCESS MESSAGE
      // ==============================
      return interaction.editReply({
        content:
          `✅ Translator system setup complete!\n\n` +
          `✔ Roles created\n` +
          `✔ Channels created\n` +
          `✔ Permissions configured\n\n` +
          `You can now use language onboarding + premium translation system.`
      });

    } catch (err) {
      console.log('Setup Translator Error:', err);

      return interaction.editReply({
        content: '❌ Failed to setup translator system'
      });
    }
  }
};
