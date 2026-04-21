import axios from 'axios';

const API_KEY = process.env.DEEPL_API_KEY;

// DeepL supported languages (important)
const DEEPL_SUPPORTED = [
  'EN', 'EN-GB', 'EN-US',
  'DE', 'FR', 'ES', 'IT', 'NL',
  'PL', 'PT', 'PT-BR',
  'RU', 'JA', 'ZH',
  'SV', 'DA', 'FI',
  'EL', 'CS', 'SK', 'RO',
  'HU', 'BG'
];

function normalizeLang(lang) {
  if (!lang) return 'EN';

  lang = lang.toUpperCase();

  // fallback if not supported
  if (!DEEPL_SUPPORTED.includes(lang)) {
    return 'EN';
  }

  return lang;
}

export async function translateText(text, targetLang = 'EN') {

  try {

    const lang = normalizeLang(targetLang);

    const params = new URLSearchParams();
    params.append('auth_key', API_KEY);
    params.append('text', text);
    params.append('target_lang', lang);

    const res = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      params
    );

    return res.data.translations[0].text;

  } catch (err) {
    console.error('Translation error:', err.message);
    return text;
  }
}
