// src/utils/detectLang.js
export function detectLang(text) {
  if (/[\u3040-\u30ff]/.test(text)) return "JA";
  if (/[\uac00-\ud7af]/.test(text)) return "KO";
  if (/[а-яА-Я]/.test(text)) return "RU";
  return "EN";
}
