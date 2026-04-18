import {
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';

export function buildLanguageMenu(userId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`setlang_${userId}`)
      .setPlaceholder('🌍 Select your language')
      .addOptions([
        { label: 'English 🇬🇧', value: 'EN' },
        { label: 'French 🇫🇷', value: 'FR' },
        { label: 'Spanish 🇪🇸', value: 'ES' },
        { label: 'German 🇩🇪', value: 'DE' },
        { label: 'Japanese 🇯🇵', value: 'JA' },
        { label: 'Korean 🇰🇷', value: 'KO' },
        { label: 'Chinese 🇨🇳', value: 'ZH' }
      ])
  );
}
