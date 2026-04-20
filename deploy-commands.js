import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 👇 Detect if running deploy script
const isDeploy = process.argv.some(arg =>
  arg.includes('deploy-commands')
);

// ==============================
// SAFE MODE (no crash during deploy)
// ==============================
if (!supabaseUrl || !supabaseKey) {
  if (!isDeploy) {
    // ❌ Real bot should still fail loudly
    throw new Error('SUPABASE ENV MISSING');
  } else {
    // ⚠️ Deploy mode → allow it
    console.warn('⚠️ Supabase skipped (deploy mode)');
  }
}

// ==============================
// CREATE CLIENT (safe fallback)
// ==============================
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
