import { EmbedBuilder } from "discord.js";

export default (client) => async (guild) => {
  try {
    const channel = guild.systemChannel;
    if (!channel) return;

    const frames = [
      "🌐 UniChat is joining...",
      "⚙️ Setting up translation system...",
      "🌍 Initializing languages...",
      "✅ Ready!"
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
      .setDescription("Run `/setup` to configure your server.");

    setTimeout(() => {
      channel.send({ embeds: [embed] });
    }, 4500);

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
