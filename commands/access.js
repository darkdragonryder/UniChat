const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('access')
    .setDescription('Grant access to a user or server')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of access: user or server')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to grant access to')
    ),

  async execute(interaction) {
    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch (err) {
      config = { allowedUsers: [], allowedServers: [] };
    }

    const type = interaction.options.getString('type');
    const user = interaction.options.getUser('user');

    if (type === 'user' && user) {
      config.allowedUsers.push(user.id);
    }

    if (type === 'server') {
      config.allowedServers.push(interaction.guild.id);
    }

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply('✅ Access granted');
  }
};
