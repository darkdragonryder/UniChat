import { supabase } from '../db/supabase.js';

// ==============================
// GENERATE LICENSE
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

  return { key };
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

  if (error || !data) {
    return { ok: false, reason: 'INVALID_KEY' };
  }

  return { ok: true, entry: data };
}

// ==============================
// MARK USED
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

  return true;
}

// ==============================
// REVOKE LICENSE
// ==============================
export async function revokeLicense(guildId) {
  const { error } = await supabase
    .from('licenses')
    .update({
      used: false,
      usedByGuild: null,
      usedByUser: null,
      usedAt: null
    })
    .eq('usedByGuild', guildId);

  if (error) throw error;

  return true;
}
