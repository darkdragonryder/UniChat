import { supabase } from "./supabase.js";

export async function translateCached(text, targetLang) {

  const hash = `${text.toLowerCase()}::${targetLang}`;

  // ================= CHECK CACHE =================
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .maybeSingle();

  if (data?.translated_text) {
    return data.translated_text;
  }

  // ================= TRANSLATE =================
  let translated;
  try {
    translated = await realTranslate(text, targetLang);
  } catch (err) {
    console.log("TRANSLATION ERROR:", err.message);
    translated = text;
  }

  // ================= SAVE CACHE =================
  const { error } = await supabase
    .from("translation_cache")
    .upsert({
      hash,
      translated_text: translated
    });

  if (error) {
    console.log("CACHE WRITE ERROR:", error.message);
  }

  return translated;
}
