export function normalizeLang(lang) {
  if (!lang) return 'en';

  const map = {
    // English
    'en': 'en',
    'en-us': 'en-us',
    'en-gb': 'en-gb',

    // European
    'fr': 'fr',
    'es': 'es',
    'de': 'de',
    'it': 'it',

    // Portuguese
    'pt': 'pt',
    'pt-pt': 'pt-pt',
    'pt-br': 'pt-br',

    // Eastern Europe / Russia
    'ru': 'ru',

    // Asia
    'ja': 'ja',
    'ko': 'ko',
    'zh': 'zh',

    // Middle East
    'ar': 'ar'
  };

  return map[String(lang).toLowerCase()] || String(lang).toLowerCase();
}
