import { EmbedBuilder, ChannelType } from "discord.js";

export default (client) => async (guild) => {
  try {

    // ================= FIND BEST CHANNEL =================
    let channel =
      guild.systemChannel ||
      guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.permissionsFor(guild.members.me).has("SendMessages")
      );

    if (!channel) return;

    // ================= ANIMATED JOIN =================
    const frames = [
      "🌐 UniChat is joining your server...",
      "⚙️ Initializing translation engine...",
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

    // ================= FINAL EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌐 UniChat Installed")
      .setDescription(
        "Thanks for adding UniChat!\n\n" +
        "Run `/setup` to configure language channels."
      );

    setTimeout(() => {
      channel.send({ embeds: [embed] }).catch(() => {});
    }, 4500);

    // ================= ROLE ASSIGN =================
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember) return;

    let role =
      guild.roles.cache.find(r =>
        r.name.toLowerCase().includes("bot")
      );

    if (!role) {
      role = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,
        hoist: true,
        mentionable: false,
        reason: "Auto bot role"
      });
    }

    await botMember.roles.add(role).catch(err => {
      console.log("ROLE ASSIGN FAILED:", err.message);
    });

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
