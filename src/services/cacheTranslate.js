import { supabase } from "./supabase.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

// ================= IN-MEMORY BATCH CACHE =================
// key: messageHash::lang -> translation
const runtimeCache = new Map();

// ================= FILTER =================
function shouldSkip(text) {
  if (!text) return true;

  const t = text.trim().toLowerCase();

  if (t.length <= 2) return true;

  const junk = ["ok", "okay", "lol", "lmao", "brb", "gg"];
  if (junk.includes(t)) return true;

  if (/^[^\p{L}\p{N}]+$/u.test(t)) return true;

  if (t.startsWith("http")) return true;

  return false;
}

// ================= HASH =================
function makeKey(text, lang) {
  return `${lang}::${text.toLowerCase().trim()}`;
}

// ================= MAIN =================
export async function translateCached(text, targetLang) {
  if (shouldSkip(text)) return text;

  const key = makeKey(text, targetLang);

  // ================= 1. RUNTIME CACHE =================
  if (runtimeCache.has(key)) {
    return runtimeCache.get(key);
  }

  // ================= 2. DATABASE CACHE =================
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", key)
    .maybeSingle();

  if (data?.translated_text) {
    runtimeCache.set(key, data.translated_text);
    return data.translated_text;
  }

  // ================= 3. DEEPL CALL =================
  let translated = text;

  try {
    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang
      })
    });

    const result = await res.json();

    if (result?.translations?.[0]?.text) {
      translated = result.translations[0].text;
    }

  } catch (err) {
    console.log("DEEPL ERROR:", err.message);
  }

  // ================= 4. SAVE CACHE =================
  await supabase.from("translation_cache").upsert({
    hash: key,
    translated_text: translated
  });

  runtimeCache.set(key, translated);

  return translated;
}

// ================= OPTIONAL: CLEAN CACHE PERIODICALLY =================
setInterval(() => {
  runtimeCache.clear();
}, 1000 * 60 * 10); // every 10 minutes
