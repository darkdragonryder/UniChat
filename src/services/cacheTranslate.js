import { supabase } from "./supabase.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

function shouldSkip(text) {
  if (!text) return true;
  if (text.trim().length <= 2) return true;

  const junk = ["ok", "okay", "lol", "lmao", "brb", "gg"];
  if (junk.includes(text.toLowerCase())) return true;

  if (/^[^\p{L}\p{N}]+$/u.test(text)) return true;
  if (text.startsWith("http")) return true;

  return false;
}

export async function translateCached(text, targetLang) {
  if (shouldSkip(text)) return text;

  const hash = `${text}::${targetLang}`;

  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .maybeSingle();

  if (data?.translated_text) return data.translated_text;

  let translated = text;

  try {
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("target_lang", targetLang);

    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const result = await res.json();

    if (result?.translations?.[0]?.text) {
      translated = result.translations[0].text;
    }

  } catch (err) {
    console.log("DEEPL ERROR:", err.message);
  }

  await supabase.from("translation_cache").upsert({
    hash,
    translated_text: translated
  });

  return translated;
}
