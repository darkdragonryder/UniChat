import { db } from "./supabase.js";

const cache = new Map();

function key(text, lang) {
  return `${lang}:${text.toLowerCase()}`;
}

export async function translateCached(text, lang) {
  if (!text) return text;

  const k = key(text, lang);

  if (cache.has(k)) return cache.get(k);

  const supabase = db();

  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", k)
    .maybeSingle();

  if (data?.translated_text) {
    cache.set(k, data.translated_text);
    return data.translated_text;
  }

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      text,
      target_lang: lang
    })
  });

  if (!res.ok) return text;

  const json = await res.json();
  const translated = json?.translations?.[0]?.text || text;

  cache.set(k, translated);

  await supabase.from("translation_cache").upsert({
    hash: k,
    translated_text: translated
  });

  return translated;
}
