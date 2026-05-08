import { db } from "./supabase.js";

const memoryCache = new Map();
const MAX_CACHE_SIZE = 10000;

function makeKey(text, lang) {
  return `${lang}:${text.toLowerCase().trim()}`;
}

function trimCache() {
  if (memoryCache.size < MAX_CACHE_SIZE) return;

  const entriesToDelete = Math.floor(MAX_CACHE_SIZE * 0.2);
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

  // ---------------- MEMORY CACHE ----------------
  if (memoryCache.has(k)) {
    return memoryCache.get(k);
  }

  try {
    // ---------------- DB CACHE ----------------
    const { data, error } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("hash", k)
      .maybeSingle();

    if (!error && data?.translated_text) {
      trimCache();
      memoryCache.set(k, data.translated_text);
      return data.translated_text;
    }

    // ---------------- DEEPL ----------------
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
      console.log(`DEEPL ERROR: HTTP ${res.status}`);
      return text;
    }

    const json = await res.json();
    const translated = json?.translations?.[0]?.text || text;

    // ---------------- FIXED SUPABASE SAVE ----------------
    try {
      const { error: upsertError } = await supabase
        .from("translation_cache")
        .upsert({
          hash: k,
          translated_text: translated,
          source_lang: json?.translations?.[0]?.detected_source_language || null
        }, {
          onConflict: "hash"
        });

      if (upsertError) {
        console.log("CACHE SAVE ERROR:", upsertError.message);
      }
    } catch (dbErr) {
      console.log("CACHE SAVE FAILED:", dbErr.message);
    }

    trimCache();
    memoryCache.set(k, translated);

    return translated;

  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
    return text;
  }
}
