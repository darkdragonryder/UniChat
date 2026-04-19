import supabase from './db.js';

// ==============================
// GET GUILD SETUP
// ==============================
export async function getGuildSetup(guildId) {
  try {
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

  } catch (err) {
    console.log('getGuildSetup catch error:', err);
    return null;
  }
}

// ==============================
// CREATE GUILD SETUP (NEW)
// ==============================
export async function createGuildSetup(guild) {
  try {
    const existing = await getGuildSetup(guild.id);

    if (existing) return existing;

    const newSetup = {
      guildId: guild.id,
      enabled: true,
      roles: [],
      channels: [],
      defaultLanguage: 'en',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const { data, error } = await supabase
      .from('guild_setup')
      .insert(newSetup)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Guild setup created for ${guild.name}`);

    return data;

  } catch (err) {
    console.log('createGuildSetup error:', err);
    return null;
  }
}

// ==============================
// SAVE / UPDATE GUILD SETUP
// ==============================
export async function saveGuildSetup(guildId, setup) {
  try {
    const { error } = await supabase
      .from('guild_setup')
      .upsert({
        guildId,
        enabled: true,
        roles: setup.roles || [],
        channels: setup.channels || [],
        defaultLanguage: setup.defaultLanguage || 'en',
        updatedAt: Date.now()
      });

    if (error) throw error;

    return true;

  } catch (err) {
    console.log('saveGuildSetup error:', err);
    return false;
  }
}

// ==============================
// CHECK IF SETUP EXISTS
// ==============================
export async function isGuildSetup(guildId) {
  try {
    const setup = await getGuildSetup(guildId);
    return setup?.enabled === true;
  } catch {
    return false;
  }
}
