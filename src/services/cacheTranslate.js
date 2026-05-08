import { db } from "./supabase.js";

const memoryCache = new Map();
const MAX_CACHE_SIZE = 10000; // Prevent unbounded growth

function makeKey(text, lang) {
  return `${lang}:${text.toLowerCase().trim()}`;
}

/**
 * LRU-style cache cleanup
 */
function trimCache() {
  if (memoryCache.size < MAX_CACHE_SIZE) return;
  const entriesToDelete = Math.floor(MAX_CACHE_SIZE * 0.2); // Remove 20%
  const keys = memoryCache.keys();
  for (let i = 0; i < entriesToDelete; i++) {
    const key = keys.next().value;
    if (key) memoryCache.delete(key);
  }
}

export async function translateCached(text, lang) {
  if (!text || !lang) return text;

  const supabase = db();
  const k = makeKey(text, lang);

  // Check memory cache
  if (memoryCache.has(k)) {
    return memoryCache.get(k);
  }

  try {
    // Check database cache
    const { data } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("hash", k)
      .maybeSingle();

    if (data?.translated_text) {
      trimCache();
      memoryCache.set(k, data.translated_text);
      return data.translated_text;
    }

    // Call DeepL API
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        text,
        target_lang: lang
      })
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 401) {
        console.error("DEEPL ERROR: Invalid API key");
      } else if (status === 429) {
        console.error("DEEPL ERROR: Rate limited");
      } else if (status === 456) {
        console.error("DEEPL ERROR: Quota exceeded");
      } else {
        console.error(`DEEPL ERROR: HTTP ${status}`);
      }
      // Return original text as fallback
      return text;
    }

    const json = await res.json();
    const translated = json?.translations?.[0]?.text || text;

    // Save to DB cache (fire and forget)
    supabase.from("translation_cache").upsert({
      hash: k,
      translated_text: translated,
      source_lang: json?.translations?.[0]?.detected_source_language || null
    }).catch(err => console.log("CACHE SAVE ERROR:", err.message));

    trimCache();
    memoryCache.set(k, translated);

    return translated;

  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
    return text; // Fallback to original
  }
}
