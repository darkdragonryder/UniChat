import { SlashCommandBuilder } from 'discord.js';
import { createDevKey } from '../services/UniChatCore.js';

export default {
  data: new SlashCommandBuilder()
    .setName('devkey')
    .setDescription('Generate license keys (OWNER ONLY)')
    .addStringOption(o =>
      o.setName('type')
        .setDescription('dev or lifetime')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type')?.toLowerCase();

    if (!['dev', 'lifetime'].includes(type)) {
      return interaction.reply({
        content: '❌ Invalid type. Use: dev or lifetime',
        ephemeral: true
      });
    }

    const key = createDevKey(type, type === 'lifetime' ? 9999 : 30);

    return interaction.reply({
      content: `✅ ${type.toUpperCase()} key generated:\n\`${key}\``,
      ephemeral: true
    });
  }
};
