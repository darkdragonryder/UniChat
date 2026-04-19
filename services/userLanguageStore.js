import supabase from './db.js';

// ==============================
// GET USER LANGUAGE
// ==============================
export async function getUserLanguage(userId, guildId) {
  const { data } = await supabase
    .from('user_languages')
    .select('*')
    .eq('userId', userId)
    .eq('guildId', guildId)
    .single();

  return data?.language || null;
}

// ==============================
// SET USER LANGUAGE
// ==============================
export async function setUserLanguage(userId, guildId, language) {
  const { error } = await supabase
    .from('user_languages')
    .upsert({
      userId,
      guildId,
      language
    });

  if (error) {
    console.log('setUserLanguage error:', error);
    return false;
  }

  return true;
}
