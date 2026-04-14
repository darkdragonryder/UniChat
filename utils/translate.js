export async function translate(text, targetLang) {
  if (!text || !targetLang) return { text };

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
    );

    const data = await res.json();

    const translatedText =
      data?.responseData?.translatedText || text;

    // MyMemory doesn't truly return detection reliably, so we estimate it
    const matchQuality = data?.responseData?.match || 0;

    // Basic heuristic detection (not perfect but stable)
    let detected = null;

    if (matchQuality > 0.8) {
      detected = targetLang;
    }

    return {
      text: translatedText,
      detected
    };

  } catch (err) {
    console.error('Translation error:', err);
    return { text };
  }
}
