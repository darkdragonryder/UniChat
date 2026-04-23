import { supabase } from "./supabase.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

// ================= SMART FILTER =================
function shouldSkip(text) {
  if (!text) return true;

  const t = text.trim().toLowerCase();

  // too short
  if (t.length <= 2) return true;

  // common junk
  const junk = ["ok", "okay", "lol", "lmao", "brb", "gg"];
  if (junk.includes(t)) return true;

  // only emojis / symbols
  if (/^[^\p{L}\p{N}]+$/u.test(t)) return true;

  // links
  if (t.startsWith("http")) return true;

  return false;
}

// ================= MAIN =================
export async function translateCached(text, targetLang) {

  if (shouldSkip(text)) return text;

  const hash = `${text.toLowerCase()}::${targetLang}`;

  // ================= CACHE =================
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .maybeSingle();

  if (data?.translated_text) {
    return data.translated_text;
  }

  let translated = text;

  try {
    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang
      })
    });

    const result = await res.json();

    // ================= SAFE PARSE =================
    if (result?.translations?.length) {
      translated = result.translations[0].text;
    } else {
      console.log("DEEPL BAD RESPONSE:", result);
    }

  } catch (err) {
    console.log("DEEPL ERROR:", err.message);
    translated = text;
  }

  // ================= CACHE SAVE =================
  await supabase
    .from("translation_cache")
    .upsert({
      hash,
      translated_text: translated
    });

  return translated;
}
