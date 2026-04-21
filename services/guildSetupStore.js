export async function saveGuildSetup(guildId, setup) {
  try {
    const { data, error } = await supabase
      .from('guild_setup')
      .upsert(
        {
          guildid: guildId,
          enabled: true,
          sourcechannelid: setup.sourceChannelId,
          roles: setup.roles,
          channels: setup.channels,
          updatedat: new Date().toISOString()
        },
        {
          onConflict: 'guildid'
        }
      )
      .select();

    if (error) {
      console.log('SAVE ERROR:', error);
      return null; // IMPORTANT: prevent crash
    }

    return data;

  } catch (err) {
    console.log('SAVE CONFIG CRASH:', err);
    return null;
  }
}
