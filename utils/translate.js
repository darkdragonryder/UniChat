const cache = new Map();

export async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  const key = `${text}_${targetLang}`;

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
        target_lang: targetLang.toUpperCase()
      })
    });

    const data = await res.json();

    const translated =
      data?.translations?.[0]?.text || text;

    cache.set(key, translated);

    return translated;

  } catch (err) {
    console.error('DeepL error:', err);
    return text;
  }
}
