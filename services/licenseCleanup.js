import supabase from '../db/supabase.js';

// =====================================================
// AUTO EXPIRE LICENSES
// =====================================================
export async function runLicenseCleanup() {
  const now = Date.now();

  // Get all active licenses
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('expired', false);

  if (error) {
    console.log('❌ cleanup fetch error:', error);
    return;
  }

  for (const license of data) {
    if (
      license.expiresAt !== null &&
      now >= license.expiresAt
    ) {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          expired: true
        })
        .eq('key', license.key);

      if (updateError) {
        console.log('❌ cleanup update error:', updateError);
      } else {
        console.log(`🧹 Expired license: ${license.key}`);
      }
    }
  }
}
