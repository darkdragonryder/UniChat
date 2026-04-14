import { SlashCommandBuilder } from 'discord.js';
import { generateKey, saveKey } from '../utils/licenses.js';

export default {
  data: new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Generate a premium license key (ADMIN ONLY)'),

  async execute(interaction) {

    // 🔐 simple safety check (you can improve later)
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const key = generateKey();
    saveKey(key);

    return interaction.reply({
      content: `🔑 Generated Key:\n\`${key}\``,
      ephemeral: true
    });
  }
};
