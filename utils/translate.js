const cache = new Map();

export async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  const key = `${text}_${targetLang}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
    );

    const data = await res.json();

    const translated = data?.responseData?.translatedText || text;

    const detected =
      data?.responseData?.matchedWords?.length
        ? data.responseData.matchedWords[0]
        : data?.matches?.[0]?.source || null;

    const result = {
      text: translated,
      detected: detected
    };

    cache.set(key, result);

    return result;

  } catch (err) {
    console.error('Translation error:', err);

    return {
      text,
      detected: null
    };
  }
}
