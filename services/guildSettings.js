const guildSettings = new Map();

/**
 * Default settings per guild
 */
export function getGuildSettings(guildId) {

  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      autoTranslate: false,
      targetLang: 'EN'
    });
  }

  return guildSettings.get(guildId);
}

/**
 * Enable/disable auto translate
 */
export function setAutoTranslate(guildId, value) {
  const settings = getGuildSettings(guildId);
  settings.autoTranslate = value;
}

/**
 * Set target language
 */
export function setTargetLang(guildId, lang) {
  const settings = getGuildSettings(guildId);
  settings.targetLang = lang;
}
