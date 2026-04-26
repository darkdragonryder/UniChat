import { supabase } from "../services/supabase.js";

const languages = {
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  KO: "🇰🇷",
  RU: "🇷🇺",
  JA: "🇯🇵"
};

const roleNames = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

export default async function setupCommand(interaction) {
  const guild = interaction.guild;

  await interaction.reply({ content: "⚙️ Setting up UniChat...", ephemeral: true });

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    const default_channel = interaction.channel.id;

    // ================= CREATE CATEGORY =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    // ================= CREATE CHANNELS =================
    const enabled_channels = {};

    for (const [lang, emoji] of Object.entries(languages)) {
      const channel = await guild.channels.create({
        name: `general-${emoji}`,
        type: 0,
        parent: category.id
      });

      enabled_channels[lang] = channel.id;
    }

    // ================= SAVE DB =================
    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      default_channel,
      enabled_channels
    });

    // ================= CREATE ROLES (LANGUAGES) =================
    for (const name of Object.values(roleNames)) {
      const exists = guild.roles.cache.find(r => r.name === name);

      if (!exists) {
        await guild.roles.create({
          name,
          mentionable: false
        });
      }
    }

    // ================= 🔥 NEW: SYSTEM ROLES =================

    // 🤖 UniChat Bot role
    let botRole = guild.roles.cache.find(r => r.name === "🤖 UniChat Bot");

    if (!botRole) {
      botRole = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2,
        mentionable: false,
        reason: "UniChat system bot role"
      });
    }

    // 🌏 UniChat Owner role
    let ownerRole = guild.roles.cache.find(r => r.name === "🌏 UniChat Owner");

    if (!ownerRole) {
      ownerRole = await guild.roles.create({
        name: "🌏 UniChat Owner",
        color: 0x00bfff,
        mentionable: false,
        reason: "UniChat owner role"
      });
    }

    // ================= ASSIGN BOT ROLE =================
    try {
      const botMember = await guild.members.fetch(interaction.client.user.id);

      if (botRole && botMember) {
        await botMember.roles.add(botRole).catch(() => {});
      }
    } catch (err) {
      console.log("⚠️ Bot role assignment failed:", err.message);
    }

    // ================= 🔥 DELAYED CATEGORY MOVE =================
    setTimeout(async () => {
      try {
        await guild.channels.fetch();

        const referenceChannel = interaction.channel;

        await category.setPosition(referenceChannel.rawPosition + 1);

        console.log("✅ Category moved successfully");

      } catch (err) {
        console.log("❌ Category move failed:", err.message);
      }
    }, 3000);

    return interaction.editReply("✅ Setup complete");

  } catch (err) {
    console.log("SETUP ERROR:", err);
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
