import axios from 'axios';

const API_KEY = process.env.DEEPL_API_KEY;

export async function translateText(text, targetLang = 'EN') {

  try {

    const params = new URLSearchParams();
    params.append('auth_key', API_KEY);
    params.append('text', text);
    params.append('target_lang', targetLang);

    const res = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      params
    );

    return res.data.translations[0].text;

  } catch (err) {
    console.error('Translation error:', err.message);
    return text;
  }
}
