import supabase from './db.js';

// Runs every X minutes
export function startLicenseExpiryWorker(client) {
  setInterval(async () => {
    try {
      const now = Date.now();

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .not('expiresAt', 'is', null);

      if (error) {
        console.log('Expiry worker error:', error);
        return;
      }

      for (const license of data || []) {
        if (license.used && license.expiresAt && now >= license.expiresAt) {
          await supabase
            .from('licenses')
            .update({
              used: true,
              expired: true
            })
            .eq('key', license.key);

          console.log(`⛔ Expired license: ${license.key}`);
        }
      }

    } catch (err) {
      console.log('Expiry worker crash:', err);
    }
  }, 10 * 60 * 1000); // every 10 min
}
