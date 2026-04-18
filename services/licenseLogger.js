import supabase from './db.js';

export async function logLicense(action, key, userId, guildId) {
  try {
    await supabase.from('license_logs').insert({
      key,
      action,
      user_id: userId,
      guild_id: guildId,
      timestamp: Date.now()
    });
  } catch (err) {
    console.log('License log error:', err);
  }
}
