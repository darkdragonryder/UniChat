const cache = new Map();

export async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  const key = `${text}_${targetLang}`;

  // =====================
  // CACHE (FAST RESPONSE)
  // =====================
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    // =====================
    // AUTO-DETECT SOURCE LANGUAGE
    // =====================
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
    );

    const data = await res.json();

    const translated =
      data?.responseData?.translatedText ||
      text;

    // Store in cache
    cache.set(key, translated);

    return translated;

  } catch (err) {
    console.error('Translation error:', err);
    return text; // safe fallback
  }
}
