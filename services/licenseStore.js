import supabase from './db.js';

// ==============================
// GENERATE LICENSE KEY
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
    type,
    durationDays,
    used: false,
    createdAt,
    expiresAt
  });

  if (error) {
    console.log('generateLicenseKey error:', error);
    throw error;
  }

  return key;
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
    return { valid: false, reason: 'INVALID' };
  }

  if (data.used) {
    return { valid: false, reason: 'USED' };
  }

  return { valid: true, entry: data };
}

// ==============================
// USE KEY
// ==============================
export async function useKey(key, guildId, userId) {
  const now = Date.now();

  const { error } = await supabase
    .from('licenses')
    .update({
      used: true,
      usedByGuild: guildId,
      usedByUser: userId,
      usedAt: now
    })
    .eq('key', key);

  if (error) {
    console.log('useKey error:', error);
    throw error;
  }
}

// ==============================
// CHECK ACTIVE LICENSE
// ==============================
export async function isLicenseActive(guildId) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('usedByGuild', guildId)
    .eq('used', true);

  if (error || !data.length) return false;

  const now = Date.now();

  for (const lic of data) {
    if (!lic.expiresAt) return true;
    if (now < lic.expiresAt) return true;
  }

  return false;
}
