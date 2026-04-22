import { supabase } from "./supabase.js";
import { translateText as deeplTranslate } from "./deepl.js";
import crypto from "crypto";

// ================= HASH =================
function makeHash(text, lang) {
  return crypto
    .createHash("sha256")
    .update(text + "|" + lang)
    .digest("hex");
}

// ================= GET CACHE =================
async function getCache(hash) {
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .single();

  return data?.translated_text || null;
}

// ================= SET CACHE =================
async function setCache(hash, text) {
  await supabase.from("translation_cache").upsert({
    hash,
    translated_text: text
  });
}

// ================= MAIN WRAPPER =================
export async function translateCached(text, targetLang) {
  const hash = makeHash(text, targetLang);

  const cached = await getCache(hash);
  if (cached) return cached;

  const translated = await deeplTranslate(text, targetLang);

  await setCache(hash, translated);

  return translated;
}
