import { supabase } from '../db/supabase.js';

// GET
export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  if (error) {
    console.error('GET ERROR:', error);
    return null;
  }

  return data;
}

// UPSERT
export async function saveGuildSetup(guildId, setup = {}) {
  const { data, error } = await supabase
    .from('guild_setup')
    .upsert({
      guildid: guildId,
      premium: setup.premium ?? false,
      licensekey: setup.licensekey ?? null,
      premiumexpiry: setup.premiumexpiry ?? null,
      updatedat: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('SAVE ERROR:', error);
    throw error;
  }

  return data;
}
