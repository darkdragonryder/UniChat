import { normalizeLang } from './languageMap.js';

const cache = new Map();
const MAX_CACHE = 500;

function setCache(key, value) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

export async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  const lang = normalizeLang(targetLang);
  const key = `${text}_${lang}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        auth_key: process.env.DEEPL_API_KEY,
        text: text,
        target_lang: lang
      })
    });

    if (!res.ok) {
      console.error(`DeepL HTTP Error: ${res.status}`);
      return { text, detected: null };
    }

    const data = await res.json();

    const translated = data?.translations?.[0]?.text;
    const detected = data?.translations?.[0]?.detected_source_language;

    if (!translated) {
      return { text, detected: null };
    }

    const result = {
      text: translated,
      detected: detected || null
    };

    setCache(key, result);

    return result;

  } catch (err) {
    console.error('DeepL error:', err);
    return { text, detected: null };
  }
}
