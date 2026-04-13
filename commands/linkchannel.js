import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('linkchannel')
    .setDescription('Link channels')
    .addChannelOption(o => o.setName('channel').setRequired(true)),

  async execute(i) {
    const target = i.options.getChannel('channel');

    const config = JSON.parse(fs.readFileSync('./config.json'));

    if (!config.linkedChannels[i.channel.id]) {
      config.linkedChannels[i.channel.id] = [];
    }

    config.linkedChannels[i.channel.id].push(target.id);

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await i.reply('✅ Channels linked');
  }
};