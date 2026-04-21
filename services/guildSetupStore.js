import { supabase } from '../db/supabase.js';

// ==============================
// GET
// ==============================
export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  if (error) {
    console.log('GET ERROR:', error);
    return null;
  }

  return data;
}

// ==============================
// UPSERT SAFE
// ==============================
export async function saveGuildSetup(guildId, setup = {}) {
  const { data, error } = await supabase
    .from('guild_setup')
    .upsert({
      guildid: guildId,
      enabled: true,
      premium: setup.premium ?? false,
      licensekey: setup.licensekey ?? null,
      premiumexpiry: setup.premiumexpiry ?? null,
      sourcechannelid: setup.sourceChannelId ?? null,
      roles: setup.roles ?? [],
      channels: setup.channels ?? [],
      updatedat: new Date().toISOString()
    })
    .select();

  if (error) {
    console.log('SAVE ERROR:', error);
    throw error;
  }

  return data;
}
