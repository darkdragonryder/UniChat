const cache = new Map();

export async function translate(text, targetLang) {
  if (!text) return { text: '', detected: null };

  const key = `${text}-${targetLang}`;
  if (cache.has(key)) return cache.get(key);

  try {
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

    const result = {
      text: data?.translations?.[0]?.text || text,
      detected: data?.translations?.[0]?.detected_source_language || null
    };

    cache.set(key, result);
    return result;

  } catch (err) {
    console.log('Translate error:', err);
    return { text, detected: null };
  }
}
