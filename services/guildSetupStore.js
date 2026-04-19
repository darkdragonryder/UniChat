import supabase from './db.js';

// ==============================
// GET GUILD SETUP
// ==============================
export async function getGuildSetup(guildId) {
  const { data, error } = await supabase
    .from('guild_setup')
    .select('*')
    .eq('guildId', guildId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.log('getGuildSetup error:', error);
    return null;
  }

  return data;
}

// ==============================
// SAVE GUILD SETUP
// ==============================
export async function saveGuildSetup(guildId, setup) {
  const { error } = await supabase
    .from('guild_setup')
    .upsert({
      guildId,
      enabled: true,
      roles: setup.roles || [],
      channels: setup.channels || [],
      updatedAt: Date.now()
    });

  if (error) {
    console.log('saveGuildSetup error:', error);
    throw error;
  }

  return true;
}

// ==============================
// CHECK IF SETUP EXISTS
// ==============================
export async function isGuildSetup(guildId) {
  const setup = await getGuildSetup(guildId);
  return setup?.enabled === true;
}
