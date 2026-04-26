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
    // ================= FETCH =================
    await guild.channels.fetch();
    await guild.roles.fetch();

    // ================= DEFAULT CHANNEL =================
    const default_channel = interaction.channel.id;

    // ================= CREATE CATEGORY (FIRST = CORRECT POSITION) =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    // ================= CREATE LANGUAGE CHANNELS =================
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

    // ================= CREATE ROLES =================
    for (const name of Object.values(roleNames)) {
      const exists = guild.roles.cache.find(r => r.name === name);

      if (!exists) {
        await guild.roles.create({
          name,
          mentionable: false
        });
      }
    }

    // ================= DONE =================
    return interaction.editReply("✅ Setup complete");

  } catch (err) {
    console.log("SETUP ERROR:", err);
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
