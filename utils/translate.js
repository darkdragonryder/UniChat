import fetch from 'node-fetch';

const cache = new Map();

// ==============================
// DEEPL TRANSLATION
// ==============================
async function translateDeepL(text, targetLang) {
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang.toUpperCase()
    })
  });

  const data = await res.json();

  if (!data?.translations?.length) {
    throw new Error('DeepL empty response');
  }

  return {
    text: data.translations[0].text,
    detected: data.translations[0].detected_source_language
  };
}

// ==============================
// MYMEMORY FALLBACK
// ==============================
async function translateMyMemory(text, targetLang) {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
  );

  const data = await res.json();

  return {
    text: data?.responseData?.translatedText || text,
    detected: null
  };
}

// ==============================
// MAIN TRANSLATE FUNCTION
// ==============================
export async function translate(text, targetLang) {
  if (!text || !targetLang) {
    return { text, detected: null };
  }

  const key = `${text}::${targetLang}`;

  // CACHE CHECK
  if (cache.has(key)) {
    return cache.get(key);
  }

  let result;

  try {
    // PRIMARY: DEEPL
    result = await translateDeepL(text, targetLang);
  } catch (err) {
    console.log('DeepL failed, using fallback:', err.message);

    try {
      // FALLBACK: MYMEMORY
      result = await translateMyMemory(text, targetLang);
    } catch (fallbackErr) {
      console.error('All translation failed:', fallbackErr);

      result = {
        text,
        detected: null
      };
    }
  }

  // CACHE RESULT
  cache.set(key, result);

  return result;
}
