import { supabase } from "./supabase.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

// DeepL uses EN, ES, DE, IT, JA, KO, RU (you’re good)
export async function translateCached(text, targetLang) {

  if (!text || text.length < 1) return text;

  const hash = `${text.toLowerCase()}::${targetLang}`;

  // ================= CACHE CHECK =================
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .maybeSingle();

  if (data?.translated_text) {
    return data.translated_text;
  }

  // ================= CALL DEEPL =================
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

    if (result?.translations?.[0]?.text) {
      translated = result.translations[0].text;
    } else {
      console.log("DEEPL BAD RESPONSE:", result);
    }

  } catch (err) {
    console.log("DEEPL ERROR:", err.message);
    translated = text; // fallback
  }

  // ================= SAVE CACHE =================
  const { error } = await supabase
    .from("translation_cache")
    .upsert({
      hash,
      translated_text: translated
    });

  if (error) {
    console.log("CACHE SAVE ERROR:", error.message);
  }

  return translated;
}
