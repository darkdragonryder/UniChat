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

  await interaction.reply({ content: "⚙️ Starting setup...", ephemeral: true });

  try {

    await guild.channels.fetch();

    // ================= 1. CREATE CATEGORY =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    // ================= 2. CREATE CHANNELS =================
    const enabled_channels = {};

    for (const [lang, emoji] of Object.entries(languages)) {

      const channel = await guild.channels.create({
        name: `general-${emoji}`,
        type: 0,
        parent: category.id
      });

      enabled_channels[lang] = channel.id;
    }

    // ================= 3. SAVE DATABASE (ONLY AFTER CHANNELS EXIST) =================
    const defaultChannel = guild.channels.cache.find(
      c => c.name === "general" && c.type === 0
    );

    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      default_channel: defaultChannel?.id || null,
      enabled_channels
    });

    // ================= 4. CREATE ROLES =================
    for (const lang of Object.keys(roleNames)) {
      let role = guild.roles.cache.find(r => r.name === roleNames[lang]);

      if (!role) {
        await guild.roles.create({
          name: roleNames[lang],
          mentionable: false
        });
      }
    }

    // ================= 5. APPLY LOCKS =================
    await applyChannelLocks(guild, { enabled_channels });

    // ================= 6. MOVE CATEGORY =================
    if (defaultChannel) {
      await category.setPosition(defaultChannel.position + 1);
    }

    // ================= DONE =================
    return interaction.editReply("✅ Setup complete");

  } catch (err) {
    console.log("Setup error:", err);
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
