// src/events/messageCreate.js
import { getGuildSettings } from "../services/supabase.js";
import { translateText } from "../services/deepl.js";
import { detectLang } from "../utils/detectLang.js";

export default (client) => async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const settings = await getGuildSettings(message.guild.id);
  if (!settings.auto_translate) return;

  const sourceLang = detectLang(message.content);
  const targetLang = settings.default_language;

  if (sourceLang === targetLang.toUpperCase()) return;

  const translated = await translateText(message.content, targetLang);

  message.channel.send({
    embeds: [
      {
        title: `🌍 Translation (${sourceLang} → ${targetLang.toUpperCase()})`,
        description: translated,
        color: 0x00ffcc
      }
    ]
  });
};
