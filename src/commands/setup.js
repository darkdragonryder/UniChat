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

// ================= BOT ROLE HANDLER =================
async function ensureBotRole(guild, client) {
  const botMember = await guild.members.fetch(client.user.id);

  const keywords = ["bots only", "bots", "bot", "system"];

  let role =
    guild.roles.cache.find(r =>
      keywords.includes(r.name.toLowerCase())
    ) ||
    guild.roles.cache.find(r =>
      keywords.some(k => r.name.toLowerCase().includes(k))
    );

  if (!role) {
    role = await guild.roles.create({
      name: "🤖 UniChat Bot",
      color: 0x5865f2,
      mentionable: false,
      reason: "Fallback UniChat bot role"
    });
  }

  await botMember.roles.add(role).catch(() => {});

  return role;
}

export default async function setupCommand(interaction) {
  const guild = interaction.guild;

  await interaction.reply({ content: "⚙️ Setting up UniChat...", ephemeral: true });

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    const default_channel = interaction.channel.id;

    // ================= CATEGORY =================
    const category = await guild.channels.create({
      name: "🌍 UniChat",
      type: 4
    });

    // ================= CHANNELS =================
    const enabled_channels = {};

    for (const [lang, emoji] of Object.entries(languages)) {
      const channel = await guild.channels.create({
        name: `general-${emoji}`,
        type: 0,
        parent: category.id
      });

      enabled_channels[lang] = channel.id;
    }

    // ================= DB =================
    await supabase.from("guild_settings").upsert({
      guild_id: guild.id,
      default_channel,
      enabled_channels
    });

    // ================= LANGUAGE ROLES =================
    for (const name of Object.values(roleNames)) {
      const exists = guild.roles.cache.find(r => r.name === name);

      if (!exists) {
        await guild.roles.create({
          name,
          mentionable: false
        });
      }
    }

    // ================= OWNER ROLE =================
    let ownerRole = guild.roles.cache.find(r => r.name === "🌏 UniChat Owner");

    if (!ownerRole) {
      ownerRole = await guild.roles.create({
        name: "🌏 UniChat Owner",
        color: 0x00bfff,
        mentionable: false
      });
    }

    // ================= BOT ROLE =================
    const botRole = await ensureBotRole(guild, interaction.client);

    // ================= ROLE SORTING =================
    await guild.roles.fetch();

    const botMember = await guild.members.fetch(interaction.client.user.id);
    const botHighest = botMember.roles.highest.position;

    let position = botHighest - 1;

    if (ownerRole) await ownerRole.setPosition(position--).catch(() => {});
    if (botRole) await botRole.setPosition(position--).catch(() => {});

    const languageOrder = [
      "Spanish",
      "German",
      "Italian",
      "Korean",
      "Russian",
      "Japanese"
    ];

    for (const name of languageOrder) {
      const role = guild.roles.cache.find(r => r.name === name);
      if (role) {
        await role.setPosition(position--).catch(() => {});
      }
    }

    // ================= CATEGORY POSITION =================
    setTimeout(async () => {
      try {
        await guild.channels.fetch();
        const referenceChannel = interaction.channel;
        await category.setPosition(referenceChannel.rawPosition + 1);
      } catch (err) {
        console.log("Category move failed:", err.message);
      }
    }, 3000);

    return interaction.editReply("✅ Setup complete");

  } catch (err) {
    console.log("SETUP ERROR:", err);
    return interaction.editReply(`❌ Setup failed: ${err.message}`);
  }
}
