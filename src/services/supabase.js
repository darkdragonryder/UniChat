import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

export function db() {
  // Return cached client if already created
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_KEY?.trim();

  console.log("SUPABASE URL INSIDE NODE:", process.env.SUPABASE_URL);
  // 🔒 Hard fail if env is missing
  if (!url || !key) {
    console.error("❌ SUPABASE_URL:", url);
    console.error("❌ SUPABASE_KEY exists:", !!key);
    throw new Error("Missing Supabase environment variables");
  }

  // 🔒 Validate URL format
  if (!url.startsWith("https://")) {
    throw new Error(`Invalid SUPABASE_URL: ${url}`);
  }

  // Create and cache client
  supabaseClient = createClient(url, key);

  console.log("✅ Supabase client initialised");

  return supabaseClient;
}
