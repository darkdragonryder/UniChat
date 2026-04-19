import supabase from '../db/supabase.js';

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

  return { key, type, durationDays, expiresAt };
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
    return { valid: false };
  }

  return { valid: true, entry: data };
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

  if (error) throw error;

  return true;
}

// ==============================
// ❌ REVOKE LICENSE (NEW)
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

// ==============================
// ⏱ EXTEND LICENSE (NEW)
// ==============================
export async function extendLicense(guildId, extraDays) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('usedByGuild', guildId)
    .single();

  if (error || !data) return false;

  const now = Date.now();

  let newExpiry = data.expiresAt;

  if (!newExpiry) {
    newExpiry = now + extraDays * 86400000;
  } else {
    newExpiry += extraDays * 86400000;
  }

  const { error: updateError } = await supabase
    .from('licenses')
    .update({
      expiresAt: newExpiry
    })
    .eq('usedByGuild', guildId);

  if (updateError) throw updateError;

  return true;
}

// ==============================
// CHECK ACTIVE
// ==============================
export async function isLicenseActive(guildId) {
  const { data } = await supabase
    .from('licenses')
    .select('*')
    .eq('usedByGuild', guildId)
    .single();

  if (!data) return false;

  if (data.expiresAt === null) return true;

  return Date.now() < data.expiresAt;
}
