import { SlashCommandBuilder } from 'discord.js';
import { translateText } from '../../services/translator.js';
import { FLAG_TO_LANG } from '../../services/languageMap.js';

export default {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text')
    .addStringOption(o =>
      o.setName('text').setDescription('Text').setRequired(true))
    .addStringOption(o =>
      o.setName('flag').setDescription('🇫🇷 🇩🇪 etc'))
    .addStringOption(o =>
      o.setName('lang').setDescription('EN FR DE etc')),

  async execute(interaction) {

    const text = interaction.options.getString('text');
    const flag = interaction.options.getString('flag');
    const langInput = interaction.options.getString('lang');

    let lang = 'EN';

    if (flag && FLAG_TO_LANG[flag]) {
      lang = FLAG_TO_LANG[flag];
    }

    if (langInput) {
      lang = langInput.toUpperCase();
    }

    await interaction.deferReply();

    const translated = await translateText(text, lang);

    await interaction.editReply({
      content: `🌍 (${lang}) ${flag || ''}\n\n${translated}`
    });
  }
};
