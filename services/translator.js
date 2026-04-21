import fetch from 'node-fetch';

export async function translateText(text, targetLang) {

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      text,
      target_lang: targetLang
    })
  });

  const data = await res.json();

  return data.translations?.[0]?.text || text;
}
