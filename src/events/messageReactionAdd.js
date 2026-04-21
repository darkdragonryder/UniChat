// src/events/messageReactionAdd.js
import { translateText } from "../services/deepl.js";

const flagMap = {
  "🇫🇷": "FR",
  "🇪🇸": "ES",
  "🇩🇪": "DE",
  "🇯🇵": "JA",
  "🇰🇷": "KO"
};

export default (client) => async (reaction, user) => {
  if (user.bot) return;

  await reaction.fetch();
  const emoji = reaction.emoji.name;

  if (!flagMap[emoji]) return;

  const targetLang = flagMap[emoji];
  const msg = reaction.message;

  const translated = await translateText(msg.content, targetLang);

  msg.reply(`🌍 ${targetLang}: ${translated}`);
};
