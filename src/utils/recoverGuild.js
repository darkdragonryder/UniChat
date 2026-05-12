import { db } from "./supabase.js";
import { ChannelType, PermissionsBitField } from "discord.js";

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
    const supabase = db();

    const { data: settings } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!settings) return;

    await guild.channels.fetch().catch(() => {});
    await guild.roles.fetch().catch(() => {});

    let enabled = settings.enabled_channels || {};
    let changed = false;

    // ================= CATEGORY =================
    let category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name === "🌍 UniChat"
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🌍 UniChat",
        type: ChannelType.GuildCategory
      }).catch(() => null);

      changed = true;
    }

    if (!category) return;

    // ================= ROLES =================
    for (const roleName of Object.values(roleNames)) {
      const exists = guild.roles.cache.find(r => r.name === roleName);
      if (exists) continue;

      await guild.roles.create({
        name: roleName,
        mentionable: false
      }).catch(() => {});
    }

    // ================= CHANNELS =================
    const baseName = settings.base_channel_name || "chat";

    for (const [lang, emoji] of Object.entries(languages)) {
      const existingId = enabled[lang];
      let channel = guild.channels.cache.get(existingId);

      if (!channel) {
        const role = guild.roles.cache.find(r => r.name === roleNames[lang]);

        channel = await guild.channels.create({
          name: `${baseName}-${emoji}`,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: role?.id || guild.roles.everyone.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
              ]
            }
          ]
        }).catch(err => {
          console.log(`CHANNEL CREATE ERROR [${lang}]:`, err.message);
          return null;
        });

        if (channel) {
          enabled[lang] = channel.id;
          changed = true;
        }
      }
    }

    // ================= CLEAN INVALID =================
    for (const [lang, id] of Object.entries(enabled)) {
      if (!guild.channels.cache.get(id)) {
        delete enabled[lang];
        changed = true;
      }
    }

    // ================= SAVE =================
    if (changed) {
      await supabase
        .from("guild_settings")
        .update({ enabled_channels: enabled })
        .eq("guild_id", guild.id)
        .catch(err => {
          console.log("RECOVER SAVE ERROR:", err.message);
        });

      console.log(`🧩 Guild recovered: ${guild.name}`);
    }

  } catch (err) {
    console.log("RECOVER GUILD ERROR:", err.message);
  }
}
