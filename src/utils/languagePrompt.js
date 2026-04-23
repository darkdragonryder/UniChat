import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

export function buildLanguageMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_language")
      .setPlaceholder("🌍 Choose your language")
      .addOptions([
        { label: "English", value: "EN", emoji: "🇬🇧" },
        { label: "Spanish", value: "ES", emoji: "🇪🇸" },
        { label: "German", value: "DE", emoji: "🇩🇪" },
        { label: "Italian", value: "IT", emoji: "🇮🇹" },
        { label: "Korean", value: "KO", emoji: "🇰🇷" },
        { label: "Russian", value: "RU", emoji: "🇷🇺" },
        { label: "Japanese", value: "JA", emoji: "🇯🇵" }
      ])
  );
}

export async function sendLanguagePrompt(channel, userId) {
  await channel.send({
    content: `<@${userId}> 🌍 Please choose your language:`,
    components: [buildLanguageMenu()]
  });
}
