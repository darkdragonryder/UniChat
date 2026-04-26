import { supabase } from "../services/supabase.js";
import { applyChannelLocks } from "../utils/applyChannelLocks.js";

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

  // ================= SAFE ACK FIRST =================
  await interaction.reply({
    content: "⚙️ Starting UniChat setup...",
    ephemeral: true
  });

  try {

    // ================= FIND GENERAL =================
    const defaultChannel = guild.channels.cache.find(
      c => c.name === "general" && c.type === 0
    );

    if (!defaultChannel) {
      return interaction.editReply("❌ #general not found");
    }

    // ================= CREATE CATEGORY =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    const enabled_channels = {};

    // ================= CREATE ROLES + CHANNELS =================
    for (const [lang, emoji] of Object.entries(languages)) {

      let role = guild.roles.cache.find(r => r.name === roleNames[lang]);

      if (!role) {
        role = await guild.roles.create({
          name: roleNames[lang],
          mentionable: false
        });
      }

      const channel = await guild.channels.create({
        name: `general-${emoji}`,
        type: 0,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"]
          },
          {
            id: role.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          }
        ]
      });

      enabled_channels[lang] = channel.id;
    }

    // ================= SAVE DB =================
    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      default_channel: defaultChannel.id,
      enabled_channels
    });

    // ================= APPLY LOCKS =================
    await applyChannelLocks(guild, { enabled_channels });

    // ================= FORCE CATEGORY POSITION (FIXED) =================
    setTimeout(async () => {
      try {
        await guild.channels.fetch();

        const general = guild.channels.cache.find(
          c => c.name === "general" && c.type === 0
        );

        const uniChat = guild.channels.cache.find(
          c => c.name === "🌍 UniChat" && c.type === 4
        );

        if (general && uniChat) {
          await uniChat.setPosition(general.position + 1);
        }

      } catch (err) {
        console.log("Category move error:", err.message);
      }
    }, 5000);

    // ================= FINAL MESSAGE (ALWAYS WORKS) =================
    return interaction.editReply("✅ UniChat setup complete");

  } catch (err) {
    console.log("Setup error:", err);
    return interaction.editReply("❌ Setup failed (check logs)");
  }
}
