import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

let supabase = null;

export function db() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_KEY?.trim();

  if (!url || !key) {
    console.error("SUPABASE_URL:", url);
    console.error("SUPABASE_KEY exists:", !!key);
    throw new Error("Missing or invalid Supabase environment variables");
  }

  if (!url.startsWith("http")) {
    throw new Error(`Invalid SUPABASE_URL: ${url}`);
  }

  supabase = createClient(url, key);
  return supabase;
}
