import { supabase } from "./supabase.js";
import crypto from "crypto";

export function makeHash(text, targetLang) {
  return crypto
    .createHash("sha256")
    .update(text + "|" + targetLang)
    .digest("hex");
}

export async function getCached(hash) {
  const { data } = await supabase
    .from("translation_cache")
    .select("translated_text")
    .eq("hash", hash)
    .single();

  return data?.translated_text || null;
}

export async function setCache(hash, text) {
  await supabase.from("translation_cache").upsert({
    hash,
    translated_text: text
  });
}
