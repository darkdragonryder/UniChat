// src/commands/settings.js
import { setUserLanguage } from "../services/supabase.js";

export const data = {
  name: "setlanguage",
  description: "Set your language",
  options: [
    {
      name: "lang",
      type: 3,
      required: true
    }
  ]
};

export async function execute(interaction) {
  const lang = interaction.options.getString("lang");

  await setUserLanguage(interaction.user.id, lang);

  await interaction.reply({
    content: `✅ Language set to ${lang}`,
    ephemeral: true
  });
}
