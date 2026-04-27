import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// simple preview system (inline to avoid extra imports issues)
function getPreview(text) {
  return {
    EN: text,
    ES: "Hola a todos",
    DE: "Hallo zusammen",
    IT: "Ciao a tutti",
    KO: "안녕하세요 여러분",
    RU: "Всем привет",
    JA: "みなさんこんにちは"
  };
}

export default async function infoCommand(interaction, client) {

  const preview = getPreview("Hello everyone");

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🌐 UniChat Dashboard")
    .setDescription(
      "Clutterless Auto Translator System\n\n" +
      "Real-time translation for every message in your server."
    )
    .addFields(
      {
        name: "📊 Stats",
        value:
          `Servers: ${client.guilds.cache.size}\n` +
          `Users: ${client.users.cache.size}`,
        inline: true
      },
      {
        name: "⚡ Status",
        value: "Online & Translating",
        inline: true
      },
      {
        name: "🌍 Live Translation Preview",
        value:
          `EN: ${preview.EN}\n` +
          `ES: ${preview.ES}\n` +
          `DE: ${preview.DE}\n` +
          `IT: ${preview.IT}`,
        inline: false
      }
    )
    .setFooter({ text: "UniChat • Global communication made simple" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🚀 Invite UniChat")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/oauth2/authorize?client_id=1493079688904704180&permissions=378762546288&scope=bot+applications.commands")
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}
