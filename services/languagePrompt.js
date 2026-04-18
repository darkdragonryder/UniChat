import {
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';

// STEP 1 - GROUP MENU
export function buildLanguageGroupMenu(userId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`langgroup_${userId}`)
      .setPlaceholder('🌍 Choose language region')
      .addOptions([
        { label: 'Europe', value: 'europe' },
        { label: 'Asia', value: 'asia' },
        { label: 'Middle East', value: 'middle_east' },
        { label: 'Africa', value: 'africa' },
        { label: 'Americas', value: 'americas' }
      ])
  );
}

// STEP 2 - LANGUAGE MENU
export function buildLanguageMenu(userId, group) {

  const maps = {
    europe: [
      { label: 'English 🇬🇧', value: 'EN' },
      { label: 'French 🇫🇷', value: 'FR' },
      { label: 'Spanish 🇪🇸', value: 'ES' },
      { label: 'German 🇩🇪', value: 'DE' },
      { label: 'Italian 🇮🇹', value: 'IT' },
      { label: 'Portuguese 🇵🇹', value: 'PT' },
      { label: 'Dutch 🇳🇱', value: 'NL' },
      { label: 'Polish 🇵🇱', value: 'PL' }
    ],

    asia: [
      { label: 'Japanese 🇯🇵', value: 'JA' },
      { label: 'Korean 🇰🇷', value: 'KO' },
      { label: 'Chinese 🇨🇳', value: 'ZH' },
      { label: 'Hindi 🇮🇳', value: 'HI' },
      { label: 'Thai 🇹🇭', value: 'TH' },
      { label: 'Vietnamese 🇻🇳', value: 'VI' }
    ],

    middle_east: [
      { label: 'Arabic 🇸🇦', value: 'AR' },
      { label: 'Hebrew 🇮🇱', value: 'HE' },
      { label: 'Persian 🇮🇷', value: 'FA' }
    ],

    africa: [
      { label: 'Swahili 🇰🇪', value: 'SW' },
      { label: 'Afrikaans 🇿🇦', value: 'AF' }
    ],

    americas: [
      { label: 'English 🇺🇸', value: 'EN-US' },
      { label: 'Spanish 🇲🇽', value: 'ES' },
      { label: 'Portuguese 🇧🇷', value: 'PT-BR' },
      { label: 'French 🇨🇦', value: 'FR-CA' }
    ]
  };

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`setlang_${userId}`)
      .setPlaceholder('🌍 Select your language')
      .addOptions(maps[group] || [])
  );
}
