import { EmbedBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { supabase } from "../services/supabase.js";

export default (client) => async (guild) => {
  try {
    console.log("🔥 GUILD CREATE:", guild.name);

    const me = guild.members.me;

    const canSend = (c) =>
      c?.permissionsFor(me)?.has(PermissionsBitField.Flags.SendMessages);

    // ================= FETCH SETTINGS =================
    const { data } = await supabase
      .from("guild_settings")
      .select("active_channel, default_channel, base_channel_name")
      .eq("guild_id", guild.id)
      .maybeSingle();

    // ================= BASE CHANNEL NAME FIX =================
    let baseChannel =
      data?.base_channel_name ||
      guild.channels.cache.get(data?.default_channel)?.name ||
      guild.channels.cache.get(data?.active_channel)?.name ||
      guild.systemChannel?.name ||
      "chat";

    baseChannel = baseChannel
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // ================= PICK CHANNEL SAFELY =================
    let channel = null;

    if (data?.active_channel) {
      const saved = guild.channels.cache.get(data.active_channel);

      if (
        saved &&
        saved.type === ChannelType.GuildText &&
        canSend(saved)
      ) {
        channel = saved;
      }
    }

    if (!channel && guild.systemChannel && canSend(guild.systemChannel)) {
      channel = guild.systemChannel;
    }

    if (!channel) {
      channel = guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          canSend(c)
      );
    }

    if (!channel) return console.log("❌ No valid channel");

    // ================= SAVE BASE CHANNEL FOR MIGRATION =================
    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      base_channel_name: baseChannel,
      active_channel: channel.id,
      default_channel: channel.id
    });

    // ================= ANIMATION =================
    const frames = [
      "🌐 UniChat is joining...",
      "⚙️ Initializing system...",
      "🌍 Connecting languages...",
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
      channel.send({ embeds: [embed] }).catch(() => {});
    }, 4500);

    // ================= ROLE SYSTEM FIX =================
    await guild.roles.fetch();

    const botMember = await guild.members.fetch(client.user.id);

    let role = guild.roles.cache.find(r =>
      r.name.toLowerCase().includes("unichat") ||
      r.name.toLowerCase().includes("bot")
    );

    if (!role) {
      role = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,
        mentionable: false,
        reason: "Auto create bot role"
      });
    }

    // FIX HIERARCHY SAFETY
    const botTop = botMember.roles.highest;

    if (role.position >= botTop.position) {
      await role.setPosition(botTop.position - 1).catch(() => {});
    }

    await botMember.roles.add(role).catch((err) => {
      console.log("ROLE ASSIGN FAILED:", err.message);
    });

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
