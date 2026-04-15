const cache = new Map();

// ==============================
// DEEPL
// ==============================
async function translateDeepL(text, targetLang) {
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang.toUpperCase()
    })
  });

  const data = await res.json();

  const translated = data?.translations?.[0]?.text;
  const detected = data?.translations?.[0]?.detected_source_language;

  if (!translated) throw new Error('DeepL failed');

  return {
    text: translated,
    detected
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
// MAIN TRANSLATE
// ==============================
export async function translate(text, targetLang) {
  if (!text || !targetLang) {
    return { text, detected: null };
  }

  const key = `${text}::${targetLang}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  let result;

  try {
    // 1. TRY DEEPL FIRST
    result = await translateDeepL(text, targetLang);
  } catch (err) {
    console.log('DeepL failed, using fallback:', err.message);

    try {
      // 2. FALLBACK
      result = await translateMyMemory(text, targetLang);
    } catch (fallbackErr) {
      console.error('All translation failed:', fallbackErr);

      result = {
        text,
        detected: null
      };
    }
  }

  cache.set(key, result);
  return result;
}
