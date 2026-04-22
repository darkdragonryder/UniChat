// src/utils/detectLang.js
function guessLanguage(text) {
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[а-яА-ЯЁё]/.test(text)) return "RU";
  return "EN";
}
