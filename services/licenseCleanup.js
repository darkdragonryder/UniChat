import supabase from './db.js';
import { getGuildConfig, saveGuildConfig } from '../utils/guildConfig.js';

// ==============================
// LICENSE CLEANUP JOB
// ==============================
export async function runLicenseCleanup() {
  try {
    const now = Date.now();

    // 🔥 Get expired licenses
    const { data: expired, error } = await supabase
      .from('licenses')
      .select('*')
      .lt('expiresAt', now)
      .not('expiresAt', 'is', null)
      .eq('used', true);

    if (error) {
      console.log('License cleanup fetch error:', error);
      return;
    }

    if (!expired || expired.length === 0) {
      return;
    }

    for (const lic of expired) {
      const guildId = lic.usedByGuild;

      if (!guildId) continue;

      const config = getGuildConfig(guildId);
      if (!config) continue;

      // 🧠 Only remove if still active premium
      if (config.premium && config.mode === 'license') {
        config.premium = false;
        config.premiumExpiry = null;
        config.mode = 'expired';

        saveGuildConfig(guildId, config);

        console.log(`❌ Premium expired for guild ${guildId}`);
      }
    }

  } catch (err) {
    console.log('runLicenseCleanup crash:', err);
  }
}
