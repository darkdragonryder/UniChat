import { supabase } from '../db/supabase.js';

// ==============================
// AUTO EXPIRE LICENSES
// ==============================
export async function runLicenseCron() {
  const now = Date.now();

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('expired', false);

  if (error) {
    console.log('Cron error:', error);
    return;
  }

  for (const lic of data) {
    if (lic.expiresAt && now >= lic.expiresAt) {
      await supabase
        .from('licenses')
        .update({ expired: true })
        .eq('key', lic.key);

      console.log(`🧹 Expired: ${lic.key}`);
    }
  }
}
