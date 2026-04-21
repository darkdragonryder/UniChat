// src/services/deepl.js
import axios from "axios";

export async function translateText(text, targetLang) {
  try {
    const res = await axios.post(
      "https://api.deepl.com/v2/translate",
      new URLSearchParams({
        auth_key: process.env.DEEPL_KEY,
        text,
        target_lang: targetLang.toUpperCase()
      })
    );

    return res.data.translations[0].text;
  } catch (err) {
    console.error("DeepL error:", err.message);
    return text;
  }
}
