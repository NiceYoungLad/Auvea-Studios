import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://towzrssskkgsbklotkhq.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Lzzerm4c_M1-7Axsv1FvUQ_P0kl2Txb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function createAuthedSupabase(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

export function createServiceSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}
