import { supabase } from '../db/supabase.js';

export async function logAction({
  action,
  user_id,
  guild_id,
  license_key,
  details
}) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      user_id,
      guild_id,
      license_key,
      details,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
