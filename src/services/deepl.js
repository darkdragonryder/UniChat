import axios from "axios";

export async function translateText(text, targetLang) {
  const res = await axios.post(
    "https://api-free.deepl.com/v2/translate",
    new URLSearchParams({
      text,
      target_lang: targetLang
    }),
    {
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return res.data.translations[0].text;
}
