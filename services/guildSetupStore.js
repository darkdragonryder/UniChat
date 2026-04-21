import { supabase } from '../db/supabase.js';

export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  if (error) {
    console.error('getGuildSetup error:', error);
    return null;
  }

  return data;
}

export async function saveGuildSetup(guildId, payload = {}) {
  const { error } = await supabase
    .from('guild_setup')
    .upsert(
      {
        guildid: guildId,
        premium: payload.premium ?? false,
        licensekey: payload.licensekey ?? null,
        premiumexpiry: payload.premiumexpiry ?? null
      },
      { onConflict: 'guildid' }
    );

  if (error) {
    console.error('saveGuildSetup error:', error);
    return false;
  }

  return true;
}
