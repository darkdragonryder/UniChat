import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function languageSuggestion(lang) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`lang_yes_${lang}`)
        .setLabel(`Yes, set ${lang}`)
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("lang_no")
        .setLabel("No, choose manually")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}
