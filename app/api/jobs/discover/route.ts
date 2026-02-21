import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';
import {
  discoverJobsByTitlesAndCountry,
  extractEntryLevelJobTitles,
  extractCountryFromResume,
} from '@/lib/discoverJobs';

export const runtime = 'nodejs';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const DISCOVERED_COMPANY_NAME = 'Discovered Jobs';

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const userId = userData.user.id;

  // 1. Load active resume
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
      { error: 'Upload and parse a resume first from the Profile page.' },
      { status: 400 }
    );
  }

  const parsedJson = latestResume.parsed_json;
  const titles = extractEntryLevelJobTitles(parsedJson);
  const country = extractCountryFromResume(parsedJson);

  // 2. Find or create the "Discovered Jobs" virtual company for this user
  let companyId = '';
  let lastScrapedAt: string | null = null;

  const { data: company } = await supabase
    .from('companies')
    .select('id, last_scraped_at')
    .eq('user_id', userId)
    .eq('name', DISCOVERED_COMPANY_NAME)
    .limit(1)
    .maybeSingle();

  if (company?.id) {
    companyId = company.id;
    lastScrapedAt = company.last_scraped_at ?? null;
  } else {
    const { data: createdCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        name: DISCOVERED_COMPANY_NAME,
        career_url: 'https://remotive.com',
        scraper_type: 'manual',
        selectors_json: null,
        enabled: true,
      })
      .select('id, last_scraped_at')
      .single();

    if (companyError || !createdCompany?.id) {
      return NextResponse.json(
        { error: companyError?.message || 'Unable to create Discovered Jobs entry.' },
        { status: 500 }
      );
    }

    companyId = createdCompany.id;
    lastScrapedAt = createdCompany.last_scraped_at ?? null;
  }

  // 3. 24h freshness check — only re-scrape if stale
  if (lastScrapedAt) {
    const age = Date.now() - new Date(lastScrapedAt).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) {
      return NextResponse.json({
        cached: true,
        last_scraped_at: lastScrapedAt,
        titles,
        country: country ?? null,
        message: 'Results are fresh (less than 24 hours old).',
      });
    }
  }

  // 4. Scrape new jobs
  const discoveredJobs = await discoverJobsByTitlesAndCountry(titles, country);

  // 5. Delete only UNSAVED jobs for this company (keep saved ones)
  await supabase
    .from('jobs')
    .delete()
    .eq('company_id', companyId)
    .neq('status', 'saved');

  // 6. Insert fresh jobs (skip ones that conflict with saved jobs)
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
        { onConflict: 'company_id,external_id', ignoreDuplicates: true }
      )
      .select('id');
    if (!error) inserted += 1;
  }

  // 7. Update last_scraped_at on the company
  const newScrapedAt = new Date().toISOString();
  await supabase
    .from('companies')
    .update({ last_scraped_at: newScrapedAt })
    .eq('id', companyId);

  return NextResponse.json({
    cached: false,
    inserted,
    total_found: discoveredJobs.length,
    titles,
    country: country ?? null,
    last_scraped_at: newScrapedAt,
  });
}
