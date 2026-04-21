const guildSettings = new Map();

export function getGuildSettings(guildId) {

  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      autoTranslate: false,
      targetLang: 'EN'
    });
  }

  return guildSettings.get(guildId);
}

export function setAutoTranslate(guildId, value) {
  const s = getGuildSettings(guildId);
  s.autoTranslate = value;
}

export function setTargetLang(guildId, lang) {
  const s = getGuildSettings(guildId);
  s.targetLang = lang;
}
