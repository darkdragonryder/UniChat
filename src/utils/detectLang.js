export function detectLang(text) {
  if (!text) return "EN";

  if (/[぀-ヿ]/.test(text)) return "JA"; // Japanese
  if (/[àèìòùáéíóú]/i.test(text)) return "IT";
  if (/[äöüß]/i.test(text)) return "DE";
  if (/[ñ¿¡]/i.test(text)) return "ES";
  if (/[ㄱ-힝]/.test(text)) return "KO";
  if (/[а-яА-ЯЁё]/i.test(text)) return "RU";

  return "EN";
}
