const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('access')
    .setDescription('Manage bot access')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('What to grant access to')
        .setRequired(true)
        .addChoices(
          { name: 'User', value: 'user' },
          { name: 'Server', value: 'server' }
        )
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to grant access (only for user type)')
    ),

  async execute(interaction) {
    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch {
      config = {
        allowedUsers: [],
        allowedServers: [],
        allowedRoles: [],
        linkedChannels: {}
      };
    }

    const type = interaction.options.getString('type');
    const user = interaction.options.getUser('user');

    // USER ACCESS
    if (type === 'user') {
      if (!user) {
        return interaction.reply({
          content: '❌ You must mention a user for user access.',
          ephemeral: true
        });
      }

      if (!config.allowedUsers.includes(user.id)) {
        config.allowedUsers.push(user.id);
      }

      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

      return interaction.reply(`✅ User access granted to **${user.tag}**`);
    }

    // SERVER ACCESS
    if (type === 'server') {
      if (!config.allowedServers.includes(interaction.guild.id)) {
        config.allowedServers.push(interaction.guild.id);
      }

      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

      return interaction.reply('✅ Server access granted');
    }
  }
};
