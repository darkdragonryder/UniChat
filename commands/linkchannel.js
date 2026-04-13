import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('linkchannel')
    .setDescription('Link channels')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to link')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getChannel('channel');

    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch {
      config = { linkedChannels: {} };
    }

    if (!config.linkedChannels[interaction.channel.id]) {
      config.linkedChannels[interaction.channel.id] = [];
    }

    if (!config.linkedChannels[interaction.channel.id].includes(target.id)) {
      config.linkedChannels[interaction.channel.id].push(target.id);
    }

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply('✅ Channels linked');
  }
};
