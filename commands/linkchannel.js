const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('linkchannel')
    .setDescription('Link this channel to another channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to link to')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getChannel('channel');

    let config;

    try {
      config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch (err) {
      config = { linkedChannels: {} };
    }

    if (!config.linkedChannels[interaction.channel.id]) {
      config.linkedChannels[interaction.channel.id] = [];
    }

    // Prevent duplicates
    if (!config.linkedChannels[interaction.channel.id].includes(target.id)) {
      config.linkedChannels[interaction.channel.id].push(target.id);
    }

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply('✅ Channels linked');
  }
};
