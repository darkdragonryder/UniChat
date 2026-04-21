import { supabase } from '../db/supabase.js';

export async function getLicense(key) {
  const { data } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .maybeSingle();

  return data;
}

export async function useLicense(key, guildId, expiry) {
  return await supabase
    .from('licenses')
    .update({
      used: true,
      usedbyguild: guildId,
      usedat: Date.now(),
      expires_at: expiry
    })
    .eq('key', key);
}
