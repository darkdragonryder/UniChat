import { supabase } from "../services/supabase.js";

const languages = {
  EN: "🇬🇧",
  ES: "🇪🇸",
  DE: "🇩🇪",
  IT: "🇮🇹",
  JA: "🇯🇵",
  KO: "🇰🇷"
};

const roleNames = {
  EN: "English",
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  JA: "Japanese",
  KO: "Korean"
};

export default async function setupCommand(interaction, client) {

  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  const guild = interaction.guild;

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    // ================= BASE NAME =================
    let base =
      interaction.channel?.name ||
      guild.systemChannel?.name ||
      "chat";

    base = base
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!base) base = "chat";

    // ================= CATEGORY =================
    let category = guild.channels.cache.find(
      c => c.name === "🌍 UniChat" && c.type === 4
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: 4
      });
    }

    const enabled_channels = {};

    // ================= CREATE CHANNELS =================
    for (const [lang, emoji] of Object.entries(languages)) {

      let channel = guild.channels.cache.find(
        c => c.name === `${base}-${emoji}`
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: `${base}-${emoji}`,
          type: 0,
          parent: category.id
        });
      } else {
        // 🔥 FORCE INTO CATEGORY (FIX YOUR ISSUE)
        await channel.setParent(category.id).catch(() => {});
      }

      enabled_channels[lang] = channel.id;
    }

    const firstChannelId = enabled_channels["EN"];

    // ================= SAVE DATABASE =================
    const { error } = await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      enabled_channels,
      base_channel_name: base,
      default_channel: firstChannelId,
      active_channel: firstChannelId
    });

    if (error) {
      console.log("DB ERROR:", error.message);
      return interaction.editReply("❌ Failed to save setup.");
    }

    // ================= CREATE ROLES =================
    for (const [lang, name] of Object.entries(roleNames)) {
      if (!guild.roles.cache.find(r => r.name === name)) {
        await guild.roles.create({
          name,
          mentionable: false
        });
      }
    }

    // ================= BOT ROLE =================
    let botRole = guild.roles.cache.find(r =>
      r.name.toLowerCase().includes("unichat")
    );

    if (!botRole) {
      botRole = await guild.roles.create({
        name: "🤖 UniChat Bot",
        color: 0x5865f2
      });
    }

    const botMember = await guild.members.fetch(client.user.id);
    await botMember.roles.add(botRole).catch(() => {});

    // ================= DONE =================
    return interaction.editReply("✅ UniChat setup complete!");

  } catch (err) {
    console.log("SETUP ERROR:", err.message);
    return interaction.editReply("❌ Setup failed.");
  }
}
