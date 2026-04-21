import { supabase } from '../db/supabase.js';

/**
 * V5 License Sync System
 * - checks expired licenses
 * - disables guild premium automatically
 */

export async function runLicenseSync(client) {
  console.log('🔄 Running License Sync (V5)...');

  const now = new Date().toISOString();

  // =========================
  // 1. FIND EXPIRED LICENSES
  // =========================
  const { data: expired } = await supabase
    .from('licenses')
    .select('*')
    .lt('expires_at', now)
    .eq('used', true);

  if (!expired || expired.length === 0) {
    console.log('✅ No expired licenses');
    return;
  }

  console.log(`⚠️ Found ${expired.length} expired licenses`);

  for (const lic of expired) {

    // =========================
    // 2. UPDATE LICENSE TABLE
    // =========================
    await supabase
      .from('licenses')
      .update({
        used: false,
        usedbyguild: null,
        usedat: null
      })
      .eq('key', lic.key);

    // =========================
    // 3. DOWNGRADE GUILD
    // =========================
    await supabase
      .from('guild_setup')
      .update({
        premium: false,
        licensekey: null,
        premiumexpirary: null
      })
      .eq('licensekey', lic.key);

    console.log(`❌ Revoked expired license: ${lic.key}`);
  }

  console.log('✅ License Sync Complete');
}
