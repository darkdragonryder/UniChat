import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from "discord.js";

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

  const embed = new EmbedBuilder()
    .setTitle("🌍 Welcome to UniChat")
    .setDescription("Select your language to continue.\nThis unlocks your chat channels automatically.")
    .setColor(0x00aaff);

  return await channel.send({
    content: `<@${userId}>`,
    embeds: [embed],
    components: [buildLanguageMenu()]
  });
}
