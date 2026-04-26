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

  await interaction.reply({
    content: "⚙️ Setting up UniChat...",
    ephemeral: true
  });

  try {

    const defaultChannel = guild.channels.cache.find(
      c => c.name === "general" && c.type === 0
    );

    if (!defaultChannel) {
      return interaction.editReply("❌ #general not found");
    }

    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    const enabled_channels = {};

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

    // SAVE DB FIRST (IMPORTANT)
    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      default_channel: defaultChannel.id,
      enabled_channels
    });

    // DELAYED LOCK (DO NOT BREAK SETUP)
    setTimeout(() => {
      applyChannelLocks(guild, { enabled_channels }).catch(() => {});
    }, 5000);

    // CATEGORY POSITION FIX
    setTimeout(async () => {
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
    }, 6000);

    return interaction.editReply("✅ UniChat setup complete");

  } catch (err) {
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
