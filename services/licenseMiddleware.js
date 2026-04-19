import { isPremium } from './unichatCore.js';

// =====================================================
// LICENSE GATE MIDDLEWARE
// =====================================================
export function requirePremium(handler) {
  return async (interaction) => {
    const guildId = interaction.guild.id;

    if (!isPremium(guildId)) {
      return interaction.reply({
        content: '❌ This server does not have an active license',
        ephemeral: true
      });
    }

    return handler(interaction);
  };
}
