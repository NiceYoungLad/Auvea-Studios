import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';
import { discoverJobsFromTerms, extractSearchTerms } from '@/lib/discoverJobs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const userId = userData.user.id;
  const { data: latestResume, error: resumeError } = await supabase
    .from('resumes')
    .select('id, parsed_json')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resumeError) {
    return NextResponse.json({ error: resumeError.message }, { status: 500 });
  }

  if (!latestResume?.parsed_json) {
    return NextResponse.json(
      { error: 'Upload and parse a resume first from Profile page.' },
      { status: 400 }
    );
  }

  const terms = extractSearchTerms(latestResume.parsed_json);
  const discoveredJobs = await discoverJobsFromTerms(terms);

  if (discoveredJobs.length === 0) {
    return NextResponse.json({
      inserted: 0,
      terms,
      message: 'No jobs found from web search for current resume terms.',
    });
  }

  let companyId = '';
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Web Search Jobs')
    .limit(1)
    .maybeSingle();

  if (company?.id) {
    companyId = company.id;
  } else {
    const { data: createdCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        name: 'Web Search Jobs',
        career_url: 'https://remotive.com',
        scraper_type: 'manual',
        selectors_json: null,
        enabled: true,
      })
      .select('id')
      .single();

    if (companyError || !createdCompany?.id) {
      return NextResponse.json(
        { error: companyError?.message || 'Unable to create Web Search Jobs company.' },
        { status: 500 }
      );
    }

    companyId = createdCompany.id;
  }

  let inserted = 0;
  for (const job of discoveredJobs) {
    const { error } = await supabase
      .from('jobs')
      .upsert(
        {
          company_id: companyId,
          external_id: job.external_id,
          title: job.title,
          location: job.location,
          url: job.url,
          posted_at: job.posted_at,
          description: job.description,
          apply_url: job.apply_url,
          scraped_at: new Date().toISOString(),
          status: 'new',
        },
        { onConflict: 'company_id,external_id' }
      )
      .select('id');
    if (!error) inserted += 1;
  }

  return NextResponse.json({ inserted, terms, total_found: discoveredJobs.length });
}
