import { SlashCommandBuilder } from 'discord.js';
import { validateKey, useKey } from '../services/licenseStore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a license key')
    .addStringOption(opt =>
      opt.setName('key')
        .setDescription('License key')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const key = interaction.options.getString('key');

      const result = await validateKey(key);

      if (!result.valid) {
        return interaction.reply({
          content: `❌ Invalid key (${result.reason})`,
          ephemeral: true
        });
      }

      await useKey(key, interaction.guild.id, interaction.user.id);

      return interaction.reply({
        content: '✅ License activated!',
        ephemeral: true
      });

    } catch (err) {
      console.log(err);
      return interaction.reply({
        content: '❌ Failed to redeem key',
        ephemeral: true
      });
    }
  }
};
