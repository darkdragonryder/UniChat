import { PermissionsBitField, ChannelType } from "discord.js";
import { supabase } from "./supabase.js";

export async function autoHeal({ guild, client }) {
  try {

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!data) return;

    const enabled = data.enabled_channels || {};
    const baseId = data.default_channel || data.active_channel;

    await guild.roles.fetch();
    await guild.channels.fetch();

    /* ================================
       1. FIX BASE CHANNEL (ENGLISH)
    =================================*/
    const baseChannel = baseId
      ? guild.channels.cache.get(baseId)
      : null;

    if (baseChannel) {
      await baseChannel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        },
        {
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]).catch(() => {});
    }

    /* ================================
       2. LANGUAGE ROLES (SKIP EN)
    =================================*/
    const roleMap = {
      ES: "Spanish",
      DE: "German",
      IT: "Italian",
      KO: "Korean",
      RU: "Russian",
      JA: "Japanese"
    };

    for (const [lang, roleName] of Object.entries(roleMap)) {

      let role = guild.roles.cache.find(r => r.name === roleName);

      if (!role) {
        role = await guild.roles.create({
          name: roleName,
          mentionable: false
        });
      }

      enabled[lang] = enabled[lang]; // ensure exists
    }

    /* ================================
       3. LANGUAGE CHANNEL FIX (SKIP EN)
    =================================*/
    const category = guild.channels.cache.find(
      c => c.name === "🌍 UniChat" && c.type === ChannelType.GuildCategory
    );

    for (const [lang, channelId] of Object.entries(enabled)) {

      if (lang === "EN") continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const role = guild.roles.cache.find(r =>
        r.name.toLowerCase().includes(lang.toLowerCase())
      );

      if (!role) continue;

      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]).catch(() => {});
    }

    return {
      status: "ok",
      fixed: true
    };

  } catch (err) {
    console.log("AUTO HEAL ERROR:", err.message);
  }
}
