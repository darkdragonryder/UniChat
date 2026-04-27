import { EmbedBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { supabase } from "../services/supabase.js";

export default (client) => async (guild) => {
  try {
    const me = guild.members.me;

    const canSend = (c) =>
      c.permissionsFor(me).has(PermissionsBitField.Flags.SendMessages);

    // ================= 1️⃣ CHECK SAVED ACTIVE CHANNEL =================
    const { data } = await supabase
      .from("guild_settings")
      .select("active_channel")
      .eq("guild_id", guild.id)
      .maybeSingle();

    let channel = null;

    if (data?.active_channel) {
      const saved = guild.channels.cache.get(data.active_channel);
      if (saved && saved.type === ChannelType.GuildText && canSend(saved)) {
        channel = saved;
      }
    }

    // ================= 2️⃣ SYSTEM CHANNEL =================
    if (!channel && guild.systemChannel && canSend(guild.systemChannel)) {
      channel = guild.systemChannel;
    }

    // ================= 3️⃣ SMART NAME MATCH =================
    if (!channel) {
      const textChannels = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildText && canSend(c)
      );

      const keywords = [
        "general",
        "chat",
        "talk",
        "main",
        "lobby",
        "jibber",
        "server",
        "welcome"
      ];

      let best = null;
      let score = 0;

      for (const c of textChannels.values()) {
        let s = 0;
        const name = c.name.toLowerCase();

        for (const k of keywords) {
          if (name.includes(k)) s++;
        }

        if (s > score) {
          score = s;
          best = c;
        }
      }

      if (best) channel = best;
      else channel = textChannels.first();
    }

    if (!channel) return;

    // ================= 🎬 ANIMATION =================
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

    // ================= 🤖 ROLE SYSTEM =================
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember) return;

    let role =
      guild.roles.cache.find(r => r.name.toLowerCase().includes("bot")) ||
      guild.roles.cache.find(r => r.name.toLowerCase().includes("unichat"));

    if (!role) {
      role = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,
        hoist: true,
        mentionable: false
      });
    }

    await botMember.roles.add(role).catch(err => {
      console.log("ROLE ASSIGN FAILED:", err.message);
    });

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
