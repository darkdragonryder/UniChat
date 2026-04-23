import { supabase } from "./supabase.js";

export async function translateCached(text, targetLang) {

  const hash = `${text.toLowerCase()}::${targetLang}`;

  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .maybeSingle();

  if (data?.translated_text) {
    return data.translated_text;
  }

  const translated = `[${targetLang}] ${text}`;

  await supabase.from("translation_cache").upsert({
    hash,
    translated_text: translated
  });

  return translated;
}
