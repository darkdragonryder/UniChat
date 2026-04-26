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

export async function recoverGuild(guild) {
  try {
    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!settings) return;

    await guild.channels.fetch();
    await guild.roles.fetch();

    let enabled = settings.enabled_channels || {};
    let changed = false;

    // ================= CATEGORY CHECK =================
    let category = guild.channels.cache.find(
      c => c.name === "🌍 UniChat" && c.type === 4
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: 4
      });
      changed = true;
    }

    // ================= ROLE RECOVERY =================
    for (const roleName of Object.values(roleNames)) {
      const exists = guild.roles.cache.find(r => r.name === roleName);

      if (!exists) {
        await guild.roles.create({
          name: roleName,
          mentionable: false
        });
      }
    }

    // ================= CHANNEL RECOVERY =================
    for (const [lang, emoji] of Object.entries(languages)) {
      const existingId = enabled[lang];
      let channel = guild.channels.cache.get(existingId);

      // if missing OR invalid → recreate
      if (!channel) {
        channel = await guild.channels.create({
          name: `general-${emoji}`,
          type: 0,
          parent: category.id
        });

        enabled[lang] = channel.id;
        changed = true;
      }
    }

    // ================= CLEAN INVALID ENTRIES =================
    for (const [lang, id] of Object.entries(enabled)) {
      if (!guild.channels.cache.get(id)) {
        delete enabled[lang];
        changed = true;
      }
    }

    // ================= SAVE FIX =================
    if (changed) {
      await supabase
        .from("guild_settings")
        .update({
          enabled_channels: enabled
        })
        .eq("guild_id", guild.id);

      console.log(`🧩 Recovered guild: ${guild.name}`);
    }

  } catch (err) {
    console.log("RECOVERY ERROR:", err.message);
  }
}
