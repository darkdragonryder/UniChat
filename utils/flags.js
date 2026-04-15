export function getFlag(lang) {
  if (!lang) return '🌍';

  const code = lang.toLowerCase();

  const flags = {
    'en': '🇬🇧',
    'en-us': '🇺🇸',
    'en-gb': '🇬🇧',

    'fr': '🇫🇷',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'pt-br': '🇧🇷',
    'pt-pt': '🇵🇹',

    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'ar': '🇸🇦'
  };

  return flags[code] || '🌍';
}
