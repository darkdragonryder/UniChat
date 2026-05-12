import { db } from "./supabase.js";

const memoryCache = new Map();
const MAX_CACHE_SIZE = 8000;

function key(text, lang) {
  return `${lang}:${text.toLowerCase().trim()}`;
}

function trimCache() {
  if (memoryCache.size < MAX_CACHE_SIZE) return;

  const iterator = memoryCache.keys();
  for (let i = 0; i < 1000; i++) {
    const k = iterator.next().value;
    if (!k) break;
    memoryCache.delete(k);
  }
}

export async function translateCached(text, lang) {
  if (!text || !lang) return text;

  const supabase = db();
  const k = key(text, lang);

  if (memoryCache.has(k)) return memoryCache.get(k);

  try {
    const { data } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("hash", k)
      .maybeSingle();

    if (data?.translated_text) {
      memoryCache.set(k, data.translated_text);
      return data.translated_text;
    }

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

    if (!res.ok) return text;

    let json;
    try {
      json = await res.json();
    } catch {
      return text;
    }

    const translated = json?.translations?.[0]?.text || text;

    await supabase.from("translation_cache").upsert({
      hash: k,
      translated_text: translated,
      source_lang: json?.translations?.[0]?.detected_source_language || null
    }).catch(() => {});

    trimCache();
    memoryCache.set(k, translated);

    return translated;

  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
    return text;
  }
}
