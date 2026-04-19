import { supabase } from '../db/supabase.js';

// ==============================
// GENERATE LICENSE
// ==============================
export async function generateLicenseKey(type, durationDays) {
  try {
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
      durationDays,
      createdAt,
      expiresAt
    });

    if (error) {
      return { ok: false, error };
    }

    return { ok: true, data: key };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==============================
// VALIDATE KEY
// ==============================
export async function validateKey(key) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) {
    return { ok: false, error: 'Invalid key' };
  }

  return { ok: true, data };
}

// ==============================
// USE KEY
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

  if (error) {
    return { ok: false, error };
  }

  return { ok: true };
}

// ==============================
// LIST LICENSES
// ==============================
export async function getAllLicenses() {
  const { data, error } = await supabase
    .from('licenses')
    .select('*');

  if (error) {
    return { ok: false, error };
  }

  return { ok: true, data };
}
