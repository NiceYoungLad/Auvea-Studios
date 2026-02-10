import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ questions: data || [] });
}
