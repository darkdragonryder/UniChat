export function getFlag(lang) {
  if (!lang) return '🌍';

  const code = lang.toUpperCase();

  const flags = {
    EN: '🇬🇧',
    EN_US: '🇺🇸',
    EN_GB: '🇬🇧',

    FR: '🇫🇷',
    ES: '🇪🇸',
    DE: '🇩🇪',
    IT: '🇮🇹',
    PT: '🇵🇹',

    RU: '🇷🇺',
    JA: '🇯🇵',
    KO: '🇰🇷',
    ZH: '🇨🇳',
    AR: '🇸🇦'
  };

  return flags[code] || '🌍';
}
