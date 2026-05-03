import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from "discord.js";
import { db } from "../services/supabase.js";

export default (client) => async (member) => {
  try {
    const guild = member.guild;
    const isOwner = member.id === process.env.OWNER_ID;

    const supabase = db(); // ✅ FIX: correct DB init

    // ================= FETCH BASE CHANNEL =================
    const { data, error } = await supabase
      .from("guild_settings")
      .select("default_channel, active_channel, owner_announced")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (error) {
      console.log("DB ERROR:", error.message);
      return;
    }

    const baseId =
      data?.default_channel ||
      data?.active_channel ||
      null;

    const baseChannel = baseId
      ? await guild.channels.fetch(baseId).catch(() => null)
      : null;

    // ================= OWNER JOIN =================
    if (isOwner) {
      await guild.roles.fetch();

      // CREATE / FIND OWNER ROLE
      let role = guild.roles.cache.find(
        r => r.name === "🌏 UniChat Owner"
      );

      if (!role) {
        role = await guild.roles.create({
          name: "🌏 UniChat Owner",
          color: 0x00bfff,
          reason: "UniChat Owner Role"
        });
      }

      // MOVE ROLE JUST BELOW BOT ROLE
      const botMember = await guild.members.fetch(client.user.id);
      await role.setPosition(
        Math.max(1, botMember.roles.highest.position - 1)
      ).catch(() => {});

      await member.roles.add(role).catch(() => {});

      // ================= ANNOUNCEMENT =================
      if (!data?.owner_announced && baseChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0x00bfff)
          .setAuthor({
            name: "UniChat Creator",
            iconURL: member.user.displayAvatarURL()
          })
          .setTitle("🚀 UniChat Creator Joined")
          .setDescription(
            `👑 **The creator has joined this server**\n\n` +
            `This is a verified UniChat instance.`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: "UniChat • Verified Instance" });

        await baseChannel.send({
          embeds: [embed],
          allowedMentions: { parse: [] }
        }).catch(() => {});

        // notify server owner
        try {
          const guildOwner = await guild.fetchOwner();
          await guildOwner.send(
            "🚀 The UniChat creator has joined your server."
          );
        } catch {}

        // mark per-guild
        await supabase.from("guild_settings").upsert({
          guild_id: guild.id,
          owner_announced: true
        });
      }

      return;
    }

    // ================= NORMAL USER =================
    if (!baseChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setTitle("🌍 Welcome to UniChat")
      .setDescription(
        `Hey ${member.user}, choose your language below to get started!\n\n` +
        `You'll only see your language channel and everything will be translated for you.`
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

    await baseChannel.send({
      content: `${member}`,
      embeds: [embed],
      components: [row]
    }).catch(() => {});

  } catch (err) {
    console.log("JOIN EVENT ERROR:", err);
  }
};
