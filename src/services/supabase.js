import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

export function db() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      `Missing Supabase env:
SUPABASE_URL=${!!url}
SUPABASE_KEY=${!!key}`
    );
  }

  if (!url.startsWith("https://")) {
    throw new Error(`Invalid SUPABASE_URL: ${url}`);
  }

  supabaseClient = createClient(url, key);

  console.log("✅ Supabase client initialised");

  return supabaseClient;
}
