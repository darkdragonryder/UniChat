import { supabase } from "./supabase.js";

const memoryCache = new Map();

function key(text, lang) {
  return `${lang}:${text.toLowerCase()}`;
}

export async function translateCached(text, lang) {

  const k = key(text, lang);

  if (memoryCache.has(k)) return memoryCache.get(k);

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
      "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      text,
      target_lang: lang
    })
  });

  const json = await res.json();

  const translated = json?.translations?.[0]?.text || text;

  await supabase.from("translation_cache").upsert({
    hash: k,
    translated_text: translated
  });

  memoryCache.set(k, translated);

  return translated;
}
