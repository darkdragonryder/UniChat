client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/")) return;

    // ===== GET USER =====
    const { data: user } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", message.author.id)
      .maybeSingle();

    if (!user) {
      await sendLanguagePrompt(message.channel, message.author.id);
      return;
    }

    // ===== GET GUILD CONFIG =====
    const { data } = await supabase
      .from("guild_settings")
      .select("*")
      .eq("guild_id", message.guild.id)
      .maybeSingle();

    if (!data) return;

    const { default_channel, enabled_channels } = data;

    const channels = await message.guild.channels.fetch();

    // ===== BUILD CHANNEL MAP =====
    const channelMap = new Map();

    // English source channel
    if (default_channel && channels.get(default_channel)) {
      channelMap.set(default_channel, "EN");
    }

    // Other languages
    for (const [lang, id] of Object.entries(enabled_channels || {})) {
      if (channels.get(id)) {
        channelMap.set(id, lang.toUpperCase());
      }
    }

    if (!channelMap.size) return;

    const sourceLang = (user.language || "EN").toUpperCase();

    // ===== FIND SOURCE CHANNEL LANGUAGE =====
    const currentLang = channelMap.get(message.channel.id);

    if (!currentLang) return; // not a tracked channel

    // ===== TRANSLATE TO ALL OTHER CHANNELS =====
    for (const [channelId, targetLang] of channelMap.entries()) {

      if (channelId === message.channel.id) continue;
      if (targetLang === currentLang) continue;

      const channel = channels.get(channelId);
      if (!channel) continue;

      const translated = await translateCached(content, targetLang);

      if (!translated || translated === content) continue;

      await channel.send(`🌍 ${translated}`).catch(() => {});
    }

  } catch (err) {
    console.log("MESSAGE ERROR:", err.message);
  }
});
