exportimport { supabase } from '../db/supabase.js';

// ==============================
// GET GUILD SETUP
// ==============================
export async function getGuildSetup(guildId) {
  try {
    const { data, error } = await supabase
      .from('guild_setup')
      .select('*')
      .eq('guildid', guildId)
      .maybeSingle();

    if (error) {
      console.log('GET SETUP ERROR:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.log('GET SETUP CRASH:', err);
    return null;
  }
}

// ==============================
// SAVE GUILD SETUP (SAFE UPSERT)
// ==============================
export async function saveGuildSetup(guildId, setup) {
  try {
    const { data, error } = await supabase
      .from('guild_setup')
      .upsert(
        {
          guildid: guildId,
          enabled: true,
          sourcechannelid: setup?.sourceChannelId ?? null,
          roles: setup?.roles ?? [],
          channels: setup?.channels ?? [],
          updatedat: new Date().toISOString()
        },
        {
          onConflict: 'guildid'
        }
      )
      .select();

    if (error) {
      console.log('SAVE SETUP ERROR:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.log('SAVE SETUP CRASH:', err);
    return null;
  }
} async function saveGuildSetup(guildId, setup) {
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
