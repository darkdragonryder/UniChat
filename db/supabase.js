import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;

// IMPORTANT: service role key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('SUPABASE_URL missing');
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');

export const supabase = createClient(supabaseUrl, supabaseKey);
