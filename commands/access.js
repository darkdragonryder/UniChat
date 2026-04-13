import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('access')
    .setDescription('Grant access to a user or server')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type: user or server')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to grant access')
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
