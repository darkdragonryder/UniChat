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

    // ================= CREATE CATEGORY =================
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

    // ================= DEFAULT CHANNEL =================
    const default_channel = interaction.channel.id;

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

    // ================= MOVE CATEGORY UNDER DEFAULT =================
    try {
      await guild.channels.fetch();

      const referenceChannel = interaction.channel;

      const allCategories = guild.channels.cache
        .filter(c => c.type === 4)
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .map(c => c.id);

      const newOrder = [];

      for (const id of allCategories) {
        if (id === category.id) continue;

        newOrder.push({ id });

        const ch = guild.channels.cache.get(id);

        if (ch && ch.rawPosition >= referenceChannel.rawPosition) {
          newOrder.push({ id: category.id });
          break;
        }
      }

      // fallback if not inserted
      if (!newOrder.find(c => c.id === category.id)) {
        newOrder.push({ id: category.id });
      }

      await guild.channels.setPositions(newOrder);

    } catch (err) {
      console.log("CATEGORY MOVE FAILED:", err.message);
    }

    // ================= DONE =================
    return interaction.editReply("✅ Setup complete");

  } catch (err) {
    console.log("SETUP ERROR:", err);
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
