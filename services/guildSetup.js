import { supabase } from '../db/supabase.js';

export async function getGuild(guildId) {
  const { data } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildid', guildId)
    .maybeSingle();

  return data;
}

export async function saveGuild(guildId, payload) {
  return await supabase
    .from('guild_setup')
    .upsert({
      guildid: guildId,
      premium: payload.premium ?? false,
      licensekey: payload.licensekey ?? null,
      premiumexpiry: payload.premiumexpiry ?? null
    });
}
