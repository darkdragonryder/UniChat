import supabase from './db.js';

// ==============================
// LICENSE AUDIT LOGGING
// ==============================
export async function logLicense(action, key, userId = null, guildId = null) {
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
