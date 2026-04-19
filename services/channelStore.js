import { supabase } from '../db/supabase.js';

// ==============================
// GET GUILD CHANNEL MAP
// ==============================
export async function getGuildChannels(guildId) {
  const { data } = await supabase
    .from('guild_channels')
    .select('*')
    .eq('guildId', guildId);

  return data || [];
}

// ==============================
// SAVE CHANNEL MAP
// ==============================
export async function saveGuildChannel(guildId, baseChannelId, language, channelId) {
  const { error } = await supabase
    .from('guild_channels')
    .upsert({
      guildId,
      baseChannelId,
      language,
      channelId
    });

  if (error) {
    console.log('channel save error:', error);
    return false;
  }

  return true;
}
