import { NextResponse } from 'next/server';
import { parseManualJobs } from '@/lib/scrape';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json();
  const { career_url, selectors_json } = body || {};
  if (!career_url || !selectors_json) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  const res = await fetch(career_url);
  if (!res.ok) {
    return NextResponse.json({ error: 'Unable to fetch career page.' }, { status: 400 });
  }
  const html = await res.text();
  const jobs = parseManualJobs(html, career_url, selectors_json);
  return NextResponse.json({ jobs });
}
