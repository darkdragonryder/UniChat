export async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );

    const data = await res.json();

    return data?.responseData?.translatedText || text;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}
