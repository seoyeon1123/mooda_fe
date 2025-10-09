import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;
  const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as
    | string
    | undefined;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as
    | string
    | undefined;
  const key = serviceRoleKey || anonKey;
  if (!supabaseUrl || !key) {
    throw new Error('Missing Supabase env: SUPABASE_URL and a key');
  }
  cached = createClient(supabaseUrl, key);
  return cached;
}
