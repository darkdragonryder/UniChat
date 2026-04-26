import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { supabase } from "../services/supabase.js";

export default (client) => async (member) => {
  try {
    const channel = member.guild.systemChannel;
    const isOwner = member.id === process.env.OWNER_ID;

    // ================= OWNER JOIN =================
    if (isOwner) {
      let role = member.guild.roles.cache.find(
        r => r.name === "🌏 UniChat Owner"
      );

      // CREATE ROLE IF NOT EXISTS
      if (!role) {
        role = await member.guild.roles.create({
          name: "🌏 UniChat Owner",
          color: 0x00bfff,
          reason: "UniChat Owner Role"
        });
      }

      // MOVE ROLE HIGH
      const botMember = await member.guild.members.fetch(client.user.id);
      await role.setPosition(botMember.roles.highest.position - 1).catch(() => {});

      // ASSIGN ROLE
      await member.roles.add(role).catch(() => {});

      // CHECK ANNOUNCE FLAG
      const { data: settings } = await supabase
        .from("guild_settings")
        .select("owner_announced")
        .eq("guild_id", member.guild.id)
        .maybeSingle();

      if (!settings?.owner_announced && channel) {

        const embed = new EmbedBuilder()
          .setColor(0x00bfff)
          .setAuthor({
            name: "UniChat Creator",
            iconURL: member.user.displayAvatarURL()
          })
          .setTitle("🌏 Creator Presence Detected")
          .setDescription(
            `👑 **The creator of UniChat has joined this server**\n\n` +
            `This is a verified UniChat instance.`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: "UniChat • Verified Instance" });

        await channel.send({
          embeds: [embed],
          allowedMentions: { parse: [] }
        });

        // DM SERVER OWNER
        try {
          const guildOwner = await member.guild.fetchOwner();
          await guildOwner.send(
            "🌏 The creator of UniChat has joined your server."
          );
        } catch {}

        // SAVE FLAG
        await supabase.from("guild_settings").upsert({
          guild_id: member.guild.id,
          owner_announced: true
        });
      }

      return;
    }

    // ================= NORMAL USER =================
    if (!channel) return;

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

    await channel.send({
      content: `${member}`,
      embeds: [embed],
      components: [row]
    });

  } catch (err) {
    console.log("JOIN EVENT ERROR:", err.message);
  }
};
