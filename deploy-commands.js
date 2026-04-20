import { createClient } from '@supabase/supabase-js';

// detect deploy script safely
const isDeploy = process.argv[1]?.includes('deploy-commands');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ==============================
// SAFE GUARD
// ==============================
if (!supabaseUrl || !supabaseKey) {
  if (!isDeploy) {
    throw new Error('SUPABASE ENV MISSING');
  } else {
    console.warn('⚠️ Supabase disabled during deploy');
  }
}

// ==============================
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);