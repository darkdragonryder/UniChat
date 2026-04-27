import { EmbedBuilder } from "discord.js";

export default (client) => async (guild) => {
  try {
    const channel = guild.systemChannel;
    if (!channel) return;

    const frames = [
      "🌐 UniChat is joining your server...",
      "⚙️ Setting up translation network...",
      "🌍 Connecting languages...",
      "✅ UniChat is ready!"
    ];

    const msg = await channel.send({ content: frames[0] });

    let i = 0;
    const interval = setInterval(async () => {
      i++;
      if (i >= frames.length) return clearInterval(interval);
      await msg.edit({ content: frames[i] });
    }, 900);

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌐 UniChat Installed")
      .setDescription(
        "Thanks for adding UniChat!\n\n" +
        "Run `/setup` to configure language channels."
      );

    setTimeout(() => {
      channel.send({ embeds: [embed] });
    }, 4500);

  } catch (err) {
    console.log("GUILD JOIN ERROR:", err.message);
  }
};
