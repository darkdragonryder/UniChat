import { supabase } from '../db/supabase.js';

/**
 * V7 License API Layer
 * (future web + bot + apps will use this)
 */

export async function getLicense(key) {
  const { data } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  return data;
}

export async function validateLicense(key) {
  const lic = await getLicense(key);

  if (!lic) return { valid: false, reason: 'NOT_FOUND' };

  if (lic.used === false) {
    return { valid: false, reason: 'NOT_ACTIVATED' };
  }

  if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, license: lic };
}
