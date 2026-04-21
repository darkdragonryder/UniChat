import { supabase } from '../db/supabase.js';

/**
 * GET guild config
 */
export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  if (error) {
    console.error('GET guild setup error:', error);
    return null;
  }

  return data;
}

/**
 * UPSERT guild config (safe replace, prevents duplicates)
 */
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
      {
        onConflict: 'guildid'
      }
    );

  if (error) {
    console.error('SAVE guild setup error:', error);
    return false;
  }

  return true;
}
