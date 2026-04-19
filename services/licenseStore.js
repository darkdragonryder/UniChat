import { supabase } from '../db/supabase.js';
import { sendLicenseWebhook } from './licenseWebhook.js';

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

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: key };
}

// ==============================
// VALIDATE (ANTI DUPLICATE SAFE)
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
// USE KEY (ATOMIC SAFE)
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
    throw new Error('LICENSE_ALREADY_USED_OR_INVALID');
  }

  await sendLicenseWebhook('USED', key, guildId, userId);

  return true;
}

// ==============================
// REVOKE
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
// EXTEND
// ==============================
export async function extendLicense(guildId, extraDays) {
  const { data } = await supabase
    .from('licenses')
    .select('*')
    .eq('usedByGuild', guildId)
    .single();

  if (!data) return false;

  const now = Date.now();

  let newExpiry = data.expiresAt;

  if (!newExpiry) {
    newExpiry = now + extraDays * 86400000;
  } else {
    newExpiry += extraDays * 86400000;
  }

  await supabase
    .from('licenses')
    .update({ expiresAt: newExpiry })
    .eq('usedByGuild', guildId);

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
