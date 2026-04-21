import { SlashCommandBuilder } from 'discord.js';
import { translateText } from '../../services/translator.js';
import { FLAG_TO_LANG } from '../../services/languageMap.js';

export default {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text using DeepL')
    .addStringOption(opt =>
      opt.setName('text')
        .setDescription('Text to translate')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('lang')
        .setDescription('Target language (EN, FR, DE...)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('flag')
        .setDescription('Country flag (🇫🇷 🇩🇪 🇪🇸 etc)')
        .setRequired(false)
    ),

  async execute(interaction) {

    const text = interaction.options.getString('text');
    const langInput = interaction.options.getString('lang');
    const flag = interaction.options.getString('flag');

    await interaction.deferReply();

    // =========================
    // DETERMINE LANGUAGE
    // =========================
    let lang = 'EN';

    if (flag && FLAG_TO_LANG[flag]) {
      lang = FLAG_TO_LANG[flag];
    }

    if (langInput) {
      lang = langInput.toUpperCase();
    }

    // =========================
    // TRANSLATE
    // =========================
    const translated = await translateText(text, lang);

    return interaction.editReply({
      content:
        `🌍 **Translation (${lang}) ${flag || ''}**\n\n` +
        `📝 Original: ${text}\n` +
        `💬 Translated: ${translated}`
    });
  }
};
