export function normalizeLang(lang) {
  if (!lang) return 'EN';

  const map = {
    // English
    'en': 'EN',
    'en-us': 'EN-US',
    'en-gb': 'EN-GB',

    // European
    'fr': 'FR',
    'es': 'ES',
    'de': 'DE',
    'it': 'IT',

    // Portuguese variants
    'pt': 'PT',
    'pt-pt': 'PT-PT',
    'pt-br': 'PT-BR',

    // Eastern Europe / Russia
    'ru': 'RU',

    // Asia
    'ja': 'JA',
    'ko': 'KO',
    'zh': 'ZH',

    // Middle East
    'ar': 'AR'
  };

  return map[lang.toLowerCase()] || lang.toUpperCase();
}
