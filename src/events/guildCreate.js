import { EmbedBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { supabase } from "../services/supabase.js";

export default (client) => async (guild) => {
  try {
    console.log("🔥 GUILD CREATE TRIGGERED:", guild.name);

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
        console.log("📍 Using saved active channel:", saved.name);
      }
    }

    // ================= 2️⃣ SYSTEM CHANNEL =================
    if (!channel && guild.systemChannel && canSend(guild.systemChannel)) {
      channel = guild.systemChannel;
      console.log("📍 Using system channel:", channel.name);
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

      if (best) {
        channel = best;
        console.log("📍 Using smart match channel:", best.name);
      } else {
        channel = textChannels.first();
        console.log("📍 Using fallback channel:", channel?.name);
      }
    }

    if (!channel) return console.log("❌ No valid channel found");

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

    // ================= 🤖 ROLE SYSTEM (DEBUG + SAFE) =================

    const botMember = await guild.members.fetch(client.user.id).catch(err => {
      console.log("❌ Failed to fetch bot member:", err.message);
      return null;
    });

    if (!botMember) return console.log("❌ botMember is null");

    // 🔐 Check permissions
    const perms = guild.members.me.permissions;
    console.log("🔐 Permissions:", perms.toArray());

    if (!perms.has(PermissionsBitField.Flags.ManageRoles)) {
      return console.log("❌ Missing ManageRoles permission");
    }

    // 🔍 Find role
    let role =
      guild.roles.cache.find(r =>
        ["bot", "bots"].some(k => r.name.toLowerCase().includes(k))
      ) ||
      guild.roles.cache.find(r =>
        r.name.toLowerCase().includes("unichat")
      );

    console.log("🔍 Found role:", role?.name || "NONE");

    // 🆕 Create role if missing
    if (!role) {
      try {
        role = await guild.roles.create({
          name: "🤖 UniChat Bot",
          color: 0x5865f2,
          hoist: true,
          mentionable: false
        });

        console.log("✅ Created role:", role.name);

      } catch (err) {
        return console.log("❌ ROLE CREATE FAILED:", err.message);
      }
    }

    // 📊 Check hierarchy
    const botHighest = botMember.roles.highest;

    console.log("📊 Bot highest:", botHighest.position);
    console.log("📊 Role position:", role.position);

    if (role.position >= botHighest.position) {
      console.log("⚠️ Role is ABOVE bot → cannot assign");
    }

    // ➕ Assign role
    try {
      await botMember.roles.add(role);
      console.log("✅ ROLE ASSIGNED SUCCESSFULLY:", role.name);
    } catch (err) {
      console.log("❌ ROLE ASSIGN FAILED:", err.message);
    }

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
