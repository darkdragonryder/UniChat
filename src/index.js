async function detectLanguage(text) {
  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
      },
      body: JSON.stringify({
        text: [text],
        target_lang: "EN" // dummy target, we only need detected source
      })
    });

    const result = await res.json();

    return result?.translations?.[0]?.detected_source_language || "EN";

  } catch {
    return "EN";
  }
}
