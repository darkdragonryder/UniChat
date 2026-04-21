// src/commands/translate.js
import { translateText } from "../services/deepl.js";

export const data = {
  name: "translate",
  description: "Translate text",
  options: [
    {
      name: "text",
      type: 3,
      required: true
    },
    {
      name: "lang",
      type: 3,
      required: true
    }
  ]
};

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const lang = interaction.options.getString("lang");

  const result = await translateText(text, lang);

  await interaction.reply({
    content: `🌍 ${result}`,
    ephemeral: true
  });
}
