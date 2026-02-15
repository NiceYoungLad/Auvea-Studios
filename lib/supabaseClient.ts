import { createClient } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createClient> | null = null;
const FALLBACK_SUPABASE_URL = 'https://towzrssskkgsbklotkhq.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Lzzerm4c_M1-7Axsv1FvUQ_P0kl2Txb';

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
