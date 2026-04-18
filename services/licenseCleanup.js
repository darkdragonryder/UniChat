import db from './db.js';

// ==============================
// AUTO CLEANUP EXPIRED LICENSES
// ==============================
export function runLicenseCleanup() {
  const now = Date.now();

  // OPTION A: mark as cleaned (safer)
  db.prepare(`
    UPDATE licenses
    SET used = 1
    WHERE expiresAt IS NOT NULL
      AND expiresAt < ?
      AND used = 0
  `).run(now);

  // OPTION B: optionally delete expired fully (UNCOMMENT IF YOU WANT HARD CLEAN)
  /*
  db.prepare(`
    DELETE FROM licenses
    WHERE expiresAt IS NOT NULL
      AND expiresAt < ?
  `).run(now);
  */

  console.log('🧹 License cleanup completed');
}
