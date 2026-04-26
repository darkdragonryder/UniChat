import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

export default (client) => async (member) => {
  try {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌍 Welcome to UniChat")
      .setDescription(
        `Hey ${member.user}, choose your language below to get started!\n\n` +
        `Once selected, you'll only see your language channel and everything will be translated for you.`
      )
      .setFooter({ text: "UniChat • Global communication made simple" });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("select_language")
      .setPlaceholder("🌐 Select your language")
      .addOptions([
        { label: "English", value: "EN", emoji: "🇬🇧" },
        { label: "Spanish", value: "ES", emoji: "🇪🇸" },
        { label: "German", value: "DE", emoji: "🇩🇪" },
        { label: "Italian", value: "IT", emoji: "🇮🇹" },
        { label: "Korean", value: "KO", emoji: "🇰🇷" },
        { label: "Russian", value: "RU", emoji: "🇷🇺" },
        { label: "Japanese", value: "JA", emoji: "🇯🇵" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await channel.send({
      content: `${member}`,
      embeds: [embed],
      components: [row]
    });

  } catch (err) {
    console.log("JOIN EVENT ERROR:", err.message);
  }
};
