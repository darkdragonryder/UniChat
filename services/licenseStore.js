import { supabase } from '../db/supabase.js';

// ==============================
// GENERATE KEY
// ==============================
export async function generateLicenseKey(type, durationDays) {
  const key = `${type}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const createdAt = Date.now();

  const expiresAt =
    durationDays === null
      ? null
      : createdAt + durationDays * 86400000;

  const { error } = await supabase.from('licenses').insert({
    key,
    used: false,
    type,
    durationDays,
    createdAt,
    expiresAt,
    expired: false
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: key };
}

// ==============================
// VALIDATE
// ==============================
export async function validateKey(key) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return { valid: false, reason: 'INVALID_KEY' };

  if (data.used) return { valid: false, reason: 'ALREADY_USED' };

  if (data.expired) return { valid: false, reason: 'EXPIRED' };

  return { valid: true, entry: data };
}

// ==============================
// USE KEY (ANTI DUPLICATE SAFE)
// ==============================
export async function useKey(key, guildId, userId) {
  const { data, error } = await supabase
    .from('licenses')
    .update({
      used: true,
      usedByGuild: guildId,
      usedByUser: userId,
      usedAt: Date.now()
    })
    .eq('key', key)
    .eq('used', false)
    .select()
    .single();

  if (error || !data) {
    throw new Error('LICENSE_ALREADY_USED');
  }

  return true;
}
