import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-translator')
    .setDescription('Setup multilingual translation system (Premium)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    // ==============================
    // LANGUAGE CONFIG
    // ==============================
    const languages = [
      { name: 'English', code: 'EN' },
      { name: 'French', code: 'FR' },
      { name: 'Spanish', code: 'ES' },
      { name: 'German', code: 'DE' },
      { name: 'Japanese', code: 'JA' },
      { name: 'Korean', code: 'KO' }
    ];

    try {
      // ==============================
      // CREATE ROLE + CHANNEL PER LANGUAGE
      // ==============================
      for (const lang of languages) {

        // ROLE
        let role = guild.roles.cache.find(r => r.name === `🌍 ${lang.name}`);

        if (!role) {
          role = await guild.roles.create({
            name: `🌍 ${lang.name}`,
            reason: 'Translator system role'
          });
        }

        // CHANNEL
        const channelName = `chat-${lang.code.toLowerCase()}`;

        let channel = guild.channels.cache.find(c => c.name === channelName);

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
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
              }
            ]
          });
        }
      }

      return interaction.editReply(
        '✅ Translator system setup complete.\nRoles + channels created.'
      );

    } catch (err) {
      console.log(err);
      return interaction.editReply('❌ Setup failed');
    }
  }
};
