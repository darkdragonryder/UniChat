import { supabase } from '../db/supabase.js';

// =====================================================
// AUTO EXPIRE LICENSES (OPTIMIZED)
// =====================================================
export async function runLicenseCleanup() {
  try {
    const now = Date.now();

    const { data, error } = await supabase
      .from('licenses')
      .select('key, expiresAt, expired')
      .eq('expired', false);

    if (error) {
      console.log('❌ cleanup fetch error:', error);
      return;
    }

    const toExpire = [];

    for (const license of data || []) {
      if (
        license.expiresAt !== null &&
        now >= license.expiresAt
      ) {
        toExpire.push(license.key);
      }
    }

    if (toExpire.length === 0) return;

    const { error: updateError } = await supabase
      .from('licenses')
      .update({ expired: true })
      .in('key', toExpire);

    if (updateError) {
      console.log('❌ cleanup update error:', updateError);
      return;
    }

    console.log(`🧹 Expired ${toExpire.length} licenses`);

  } catch (err) {
    console.log('❌ cleanup crash:', err);
  }
}
