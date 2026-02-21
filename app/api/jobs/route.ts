import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  if (source === 'discovered') {
    // Get the Discovered Jobs virtual company for this user
    const { data: company } = await supabase
      .from('companies')
      .select('id, last_scraped_at')
      .eq('user_id', userData.user.id)
      .eq('name', 'Discovered Jobs')
      .limit(1)
      .maybeSingle();

    if (!company?.id) {
      return NextResponse.json({ jobs: [], last_scraped_at: null });
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*, company:companies(id, name)')
      .eq('company_id', company.id)
      .order('scraped_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      jobs: data || [],
      last_scraped_at: company.last_scraped_at ?? null,
    });
  }

  // Default: return all jobs across all companies
  const { data, error } = await supabase
    .from('jobs')
    .select('*, company:companies(id, name)')
    .order('scraped_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data || [] });
}
