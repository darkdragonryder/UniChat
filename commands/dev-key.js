import { SlashCommandBuilder } from 'discord.js';
import { addLicenseKey } from '../services/licenseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('devkey')
    .setDescription('Create license keys (ADMIN ONLY)')
    .addStringOption(o =>
      o.setName('type')
        .setDescription('dev or lifetime')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('key')
        .setDescription('Key value')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type');
    const key = interaction.options.getString('key');

    await addLicenseKey(interaction.guild.id, type, key);

    return interaction.reply({
      content: `✅ ${type} key added`,
      ephemeral: true
    });
  }
};
