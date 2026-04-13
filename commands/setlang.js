import { SlashCommandBuilder } from 'discord.js';
import { setUserLanguage } from '../utils/language.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your language')
    .addStringOption(o => o.setName('lang').setRequired(true)),

  async execute(i) {
    const lang = i.options.getString('lang');
    await setUserLanguage(i.user.id, lang);
    await i.reply(`✅ Language set to ${lang}`);
  }
};