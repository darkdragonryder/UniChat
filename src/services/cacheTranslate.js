import { supabase } from "./supabase.js";

export async function translateCached(text, targetLang) {

  const key = `${text.toLowerCase()}::${targetLang}`;

  const { data } = await supabase
    .from("translation_cache")
    .select("translated")
    .eq("cache_key", key)
    .maybeSingle();

  if (data?.translated) {
    return data.translated;
  }

  // call real translation API here
  const translated = await realTranslate(text, targetLang);

  await supabase.from("translation_cache").upsert({
    cache_key: key,
    translated
  });

  return translated;
}
