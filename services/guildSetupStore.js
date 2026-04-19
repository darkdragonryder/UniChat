import { supabase } from '../db/supabase.js';

// GET
export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.log('GET ERROR:', error);
    return null;
  }

  return data;
}

// SAVE
export async function saveGuildSetup(guildId, setup) {
  const { data, error } = await supabase
    .from('guild_setup')
    .upsert({
      guildid: guildId,
      enabled: true,
      sourcechannelid: setup.sourceChannelId,
      roles: setup.roles,
      channels: setup.channels,
      updatedat: new Date().toISOString()
    })
    .select();

  if (error) {
    console.log('SAVE ERROR:', error);
    throw error;
  }

  return data;
}
