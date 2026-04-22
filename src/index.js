client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  const { data: guildData } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("guild_id", message.guild.id)
    .single();

  if (!guildData) return;

  const channels = guildData.enabled_channels || {};
  const defaultChannelId = guildData.default_channel;

  const allChannelIds = Object.values(channels);

  // include default channel in system
  if (defaultChannelId) {
    allChannelIds.push(defaultChannelId);
  }

  // ================= SOURCE CHANNEL =================
  const sourceChannelId = message.channel.id;

  // ignore unknown channels
  if (!allChannelIds.includes(sourceChannelId)) return;

  try {
    for (const channelId of allChannelIds) {
      if (channelId === sourceChannelId) continue;

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) continue;

      const translated = await translateText(content, "EN");

      await channel.send(`🌍 ${translated}`);
    }

  } catch (err) {
    console.log("❌ MIRROR ERROR:", err.message);
  }
});
