const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('access')
    .setDescription('Grant access')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('user or server')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User (only for user type)')
    ),

  async execute(interaction) {
    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch {
      config = { allowedUsers: [], allowedServers: [] };
    }

    const type = interaction.options.getString('type');
    const user = interaction.options.getUser('user');

    if (type === 'user') {
      if (!user) {
        return interaction.reply('❌ Please mention a user');
      }

      if (!config.allowedUsers.includes(user.id)) {
        config.allowedUsers.push(user.id);
      }

      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
      return interaction.reply(`✅ Access granted to ${user.tag}`);
    }

    if (type === 'server') {
      if (!config.allowedServers.includes(interaction.guild.id)) {
        config.allowedServers.push(interaction.guild.id);
      }

      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
      return interaction.reply('✅ Server access granted');
    }
  }
};
