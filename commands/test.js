import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('basic test'),

  async execute(interaction) {
    console.log("TEST HIT");
    return interaction.reply({ content: "✅ Command working", ephemeral: true });
  }
};
