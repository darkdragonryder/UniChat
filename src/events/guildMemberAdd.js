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

    const supabase = db();

    const { data } = await supabase
      .from("guild_settings")
      .select("default_channel, active_channel, owner_announced")
      .eq("guild_id", guild.id)
      .maybeSingle();

    const baseId = data?.default_channel || data?.active_channel;

    const baseChannel = baseId
      ? await guild.channels.fetch(baseId).catch(() => null)
      : null;

    // ================= OWNER =================
    if (isOwner) {
      await guild.roles.fetch();

      let role = guild.roles.cache.find(r =>
        r.name === "🌍 UniChat Owner"
      );

      if (!role) {
        role = await guild.roles.create({
          name: "🌍 UniChat Owner",
          color: 0x00bfff,
          reason: "UniChat Owner Role"
        });
      }

      const botMember = await guild.members.fetch(client.user.id);

      await role.setPosition(
        Math.max(1, botMember.roles.highest.position - 1)
      ).catch(() => {});

      await member.roles.add(role).catch(() => {});

      if (!data?.owner_announced && baseChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0x00bfff)
          .setTitle("🚀 UniChat Creator Joined")
          .setDescription("👑 The creator has joined this server.\nVerified UniChat instance.")
          .setTimestamp();

        await baseChannel.send({
          embeds: [embed],
          allowedMentions: { parse: [] }
        });

        const owner = await guild.fetchOwner().catch(() => null);
        await owner?.send("🚀 UniChat creator joined your server").catch(() => {});

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
        `Hey ${member.user}, choose your language below.\nMessages will auto-translate globally.`
      );

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
    });

  } catch (err) {
    console.log("JOIN EVENT ERROR:", err?.message || err);
  }
};
