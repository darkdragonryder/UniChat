import { createClient } from "@supabase/supabase-js";

let supabaseInstance = null;

/**
 * Primary DB initializer (recommended usage)
 */
export function db() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });

  return supabaseInstance;
}

/**
 * Backwards compatibility export
 * Allows: import { supabase } from "../services/supabase.js";
 * without breaking existing code.
 */
export const supabase = new Proxy({}, {
  get: (_, prop) => {
    const client = db();
    return typeof client[prop] === "function"
      ? client[prop].bind(client)
      : client[prop];
  }
});
