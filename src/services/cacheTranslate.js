import { supabase } from "./supabase.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

// ================= IN-MEMORY SHORT CACHE =================
// prevents repeated calls inside runtime window
const memoryCache = new Map();

// ================= CLEAN KEY =================
function makeKey(text, targetLang) {
  return `${targetLang}::${text.toLowerCase().trim()}`;
}

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

// ================= MAIN =================
export async function translateCached(text, targetLang) {
  if (shouldSkip(text)) return text;

  const key = makeKey(text, targetLang);

  // ================= 1. MEMORY CACHE (FASTEST) =================
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // ================= 2. DB CACHE =================
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", key)
    .maybeSingle();

  if (data?.translated_text) {
    memoryCache.set(key, data.translated_text);
    return data.translated_text;
  }

  // ================= 3. CALL DEEPL =================
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

  memoryCache.set(key, translated);

  return translated;
}
