import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ companies: data || [] });
}

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json();
  const { name, career_url, scraper_type, selectors_json } = body || {};
  if (!name || !career_url || !scraper_type) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: userData.user.id,
      name,
      career_url,
      scraper_type,
      selectors_json: selectors_json || null,
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ company: data });
}
