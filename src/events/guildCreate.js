import { EmbedBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { supabase } from "../services/supabase.js";

export default (client) => async (guild) => {
  try {

    const me = guild.members.me;

    const canSend = (c) =>
      c?.permissionsFor(me)?.has(PermissionsBitField.Flags.SendMessages);

    const { data } = await supabase
      .from("guild_settings")
      .select("active_channel, default_channel, base_channel_name")
      .eq("guild_id", guild.id)
      .maybeSingle();

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

    let channel =
      guild.channels.cache.get(data?.active_channel) ||
      guild.systemChannel ||
      guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText && canSend(c)
      );

    if (!channel) return;

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
        mentionable: false
      });
    }

    if (role.position >= botMember.roles.highest.position) {
      await role.setPosition(botMember.roles.highest.position - 1).catch(() => {});
    }

    await botMember.roles.add(role).catch(() => {});

  } catch (err) {
    console.log("GUILD CREATE ERROR:", err.message);
  }
};
