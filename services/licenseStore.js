import supabase from './db.js';

// ==============================
// GENERATE LICENSE KEY
// ==============================
export async function generateLicenseKey(type, durationDays) {
  const key = `${type.toLowerCase()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

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

  if (error) {
    console.log('generateLicenseKey error:', error);
    throw error;
  }

  return {
    key,
    type: type.toLowerCase(),
    durationDays,
    expiresAt
  };
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
    return { valid: false, reason: 'INVALID_KEY' };
  }

  if (data.used) {
    return { valid: false, reason: 'ALREADY_USED' };
  }

  return { valid: true, entry: data };
}

// ==============================
// USE KEY
// ==============================
export async function useKey(key, guildId, userId) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data || data.used) return false;

  const now = Date.now();

  const { error: updateError } = await supabase
    .from('licenses')
    .update({
      used: true,
      usedByGuild: guildId,
      usedByUser: userId,
      usedAt: now
    })
    .eq('key', key);

  if (updateError) {
    console.log('useKey error:', updateError);
    throw updateError;
  }

  return true;
}

// ==============================
// CHECK ACTIVE
// ==============================
export async function isLicenseActive(key) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return false;

  if (!data.used) return true;

  if (data.expiresAt === null) return true;

  return Date.now() < data.expiresAt;
}
