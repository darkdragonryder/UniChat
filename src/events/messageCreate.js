export default (client) => async (message) => {
  console.log("EVENT FIRED:", message.content);

  if (message.author.bot) return;
  if (!message.guild) return;

  const settings = await getGuildSettings(message.guild.id);

// DEBUG
console.log("SETTINGS:", settings);

// SAFE DEFAULT (IMPORTANT)
const autoTranslate = settings?.auto_translate ?? true;

if (!autoTranslate) {
  console.log("Auto translate disabled");
  return;
}
  const sourceLang = detectLang(message.content);
  const targetLang = settings?.default_language || "en";

  if (sourceLang === targetLang.toUpperCase()) return;

  const translated = await translateText(message.content, targetLang);

  if (!translated) {
    console.log("DeepL returned empty result");
    return;
  }

  await message.channel.send({
    embeds: [
      {
        title: `🌍 Translation (${sourceLang} → ${targetLang.toUpperCase()})`,
        description: translated,
        color: 0x00ffcc
      }
    ]
  });
};
