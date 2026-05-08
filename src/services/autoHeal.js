import { PermissionsBitField, ChannelType } from "discord.js";
import { db } from "./supabase.js";

const roleMap = {
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
  KO: "Korean",
  RU: "Russian",
  JA: "Japanese"
};

export async function autoHeal({ guild, client }) {
  try {
    const supabase = db();

    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", guild.id)
      .maybeSingle();

    if (!data) return { status: "no_data", fixed: false };

    const enabled = data.enabled_channels || {};
    const baseId = data.default_channel || data.active_channel;

    await guild.roles.fetch();
    await guild.channels.fetch();

    // Fix base channel permissions
    const baseChannel = baseId ? guild.channels.cache.get(baseId) : null;

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
      ]).catch(err => console.log("BASE CHANNEL HEAL ERROR:", err.message));
    }

    // Ensure all language roles exist
    for (const [lang, roleName] of Object.entries(roleMap)) {
      let role = guild.roles.cache.find(r => r.name === roleName);

      if (!role) {
        try {
          role = await guild.roles.create({
            name: roleName,
            mentionable: false,
            reason: "UniChat auto-heal"
          });
          console.log(`â Created missing role: ${roleName}`);
        } catch (err) {
          console.log(`ROLE CREATE ERROR [${roleName}]:`, err.message);
        }
      }
    }

    // Fix language channel permissions
    for (const [lang, channelId] of Object.entries(enabled)) {
      if (lang === "EN") continue;
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        console.log(`â ï¸ Missing channel for ${lang}: ${channelId}`);
        continue;
      }

      const role = guild.roles.cache.find(r => r.name === roleMap[lang]);
      if (!role) {
        console.log(`â ï¸ Missing role for ${lang}`);
        continue;
      }

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
      ]).catch(err => console.log(`CHANNEL HEAL ERROR [${lang}]:`, err.message));
    }

    return { status: "ok", fixed: true };

  } catch (err) {
    console.log("AUTO HEAL ERROR:", err.message);
    return { status: "error", fixed: false, error: err.message };
  }
}
