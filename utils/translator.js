import axios from 'axios';
import translate from '@vitalets/google-translate-api';

export async function translateText(text, target) {
  try {
    const res = await translate(text, { to: target });
    return res.text;
  } catch {
    try {
      const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`);
      return res.data.responseData.translatedText;
    } catch {
      return text;
    }
  }
}