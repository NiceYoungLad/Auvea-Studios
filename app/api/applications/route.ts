import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(id, title, url)')
    .order('started_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ applications: data || [] });
}

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json();
  const { job_id } = body || {};
  if (!job_id) {
    return NextResponse.json({ error: 'Missing job_id.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userData.user.id,
      job_id,
      status: 'queued',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}
