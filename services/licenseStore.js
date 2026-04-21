import { supabase } from '../db/supabase.js';

// ==============================
// GENERATE LICENSE KEY
// ==============================
export async function generateLicenseKey(type, durationDays) {
  const key = `${type.toLowerCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const createdAt = Date.now();

  const expiresAt =
    durationDays === null
      ? null
      : createdAt + durationDays * 86400000;

  const { error } = await supabase.from('licenses').insert({
    key,
    used: false,
    type: type.toLowerCase(),
    durationDays: durationDays ?? null,
    createdAt,
    expiresAt
  });

  if (error) throw error;

  // IMPORTANT: return STRING ONLY
  return key;
}

// ==============================
// VALIDATE LICENSE
// ==============================
export async function validateKey(key) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: 'SUPABASE_ERROR' };
  }

  if (!data) {
    return { ok: false, reason: 'INVALID_KEY' };
  }

  if (data.used) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  if (data.expiresAt && Date.now() > data.expiresAt) {
    return { ok: false, reason: 'EXPIRED' };
  }

  return { ok: true, entry: data };
}

// ==============================
// USE LICENSE
// ==============================
export async function useKey(key, guildId, userId) {
  const { error } = await supabase
    .from('licenses')
    .update({
      used: true,
      usedByGuild: guildId,
      usedByUser: userId,
      usedAt: Date.now()
    })
    .eq('key', key);

  if (error) throw error;

  return { ok: true };
}
