import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseServer';
import { parseGreenhouseJobs, parseLeverJobs, parseManualJobs } from '@/lib/scrape';

export const runtime = 'nodejs';

async function runScrape() {
  const supabase = createServiceSupabase();
  const { data: companies, error } = await supabase.from('companies').select('*').eq('enabled', true);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const company of companies || []) {
    try {
      if (company.last_scraped_at) {
        const last = new Date(company.last_scraped_at).getTime();
        if (Date.now() - last < 23 * 60 * 60 * 1000) {
          continue;
        }
      }
      let jobs = [];
      if (company.scraper_type === 'greenhouse') {
        jobs = await parseGreenhouseJobs(company.career_url);
      } else if (company.scraper_type === 'lever') {
        jobs = await parseLeverJobs(company.career_url);
      } else {
        const res = await fetch(company.career_url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${company.career_url}`);
        }
        const html = await res.text();
        jobs = parseManualJobs(html, company.career_url, company.selectors_json || {});
      }

      for (const job of jobs) {
        const { error: upsertError } = await supabase
          .from('jobs')
          .upsert(
            {
              company_id: company.id,
              external_id: job.external_id,
              title: job.title,
              location: job.location,
              url: job.url,
              apply_url: job.apply_url,
              posted_at: job.posted_at,
              description: job.description,
              scraped_at: new Date().toISOString(),
            },
            { onConflict: 'company_id,external_id' }
          )
          .select();

        if (upsertError) {
          throw upsertError;
        }
      }

      await supabase.from('companies').update({ last_scraped_at: new Date().toISOString() }).eq('id', company.id);
      await supabase.from('scrape_runs').insert({
        company_id: company.id,
        run_at: new Date().toISOString(),
        status: 'success',
      });
    } catch (err: any) {
      await supabase.from('scrape_runs').insert({
        company_id: company.id,
        run_at: new Date().toISOString(),
        status: 'failed',
        error: err.message,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST() {
  return runScrape();
}

export async function GET() {
  return runScrape();
}
