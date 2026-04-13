import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('access')
    .setDescription('Grant access')
    .addStringOption(o => o.setName('type').setRequired(true))
    .addUserOption(o => o.setName('user')),

  async execute(i) {
    const config = JSON.parse(fs.readFileSync('./config.json'));
    const type = i.options.getString('type');
    const user = i.options.getUser('user');

    if (type === 'user' && user) config.allowedUsers.push(user.id);
    if (type === 'server') config.allowedServers.push(i.guild.id);

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await i.reply('✅ Access granted');
  }
};