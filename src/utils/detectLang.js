export function detectLang(text) {
  if (!text) return "EN";

  if (/[\u3040-\u30ff]/.test(text)) return "JA"; // Japanese
  if (/[àèìòù]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[\u3131-\uD79D]/.test(text)) return "KO";
  if (/[а-яА-ЯЁё]/i.test(text)) return "RU";

  return "EN";
}
