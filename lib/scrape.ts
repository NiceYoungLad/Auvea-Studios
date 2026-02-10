import * as cheerio from 'cheerio';
import crypto from 'crypto';

export type ManualSelectors = {
  listItem: string;
  title: string;
  link: string;
  location?: string;
  postedAt?: string;
};

export type ScrapedJob = {
  external_id: string;
  title: string;
  location?: string;
  url: string;
  posted_at?: string;
  description?: string;
  apply_url?: string;
};

export function hashExternalId(title: string, url: string) {
  return crypto.createHash('sha1').update(`${title}|${url}`).digest('hex');
}

export function parseManualJobs(html: string, careerUrl: string, selectors: ManualSelectors): ScrapedJob[] {
  if (!selectors?.listItem || !selectors?.title || !selectors?.link) {
    return [];
  }
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  $(selectors.listItem).each((_, el) => {
    const title = $(el).find(selectors.title).text().trim();
    const linkEl = $(el).find(selectors.link);
    const href = linkEl.attr('href') || '';
    if (!title || !href) return;
    const url = new URL(href, careerUrl).toString();
    const location = selectors.location ? $(el).find(selectors.location).text().trim() : undefined;
    const posted_at = selectors.postedAt ? $(el).find(selectors.postedAt).text().trim() : undefined;
    jobs.push({
      external_id: hashExternalId(title, url),
      title,
      url,
      location,
      posted_at,
      apply_url: url,
    });
  });

  return jobs;
}

export async function parseGreenhouseJobs(careerUrl: string): Promise<ScrapedJob[]> {
  const slugMatch = careerUrl.match(/greenhouse\.io\/(?:boards\/)?([A-Za-z0-9_-]+)/i);
  const slug = slugMatch?.[1];
  if (!slug) return [];

  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs: any[] };
  return (data.jobs || []).map((job) => ({
    external_id: hashExternalId(job.title, job.absolute_url),
    title: job.title,
    location: job.location?.name,
    url: job.absolute_url,
    apply_url: job.absolute_url,
    description: job.content,
    posted_at: job.updated_at,
  }));
}

export async function parseLeverJobs(careerUrl: string): Promise<ScrapedJob[]> {
  const slugMatch = careerUrl.match(/lever\.co\/([A-Za-z0-9_-]+)/i);
  const slug = slugMatch?.[1];
  if (!slug) return [];

  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) return [];
  const data = (await res.json()) as any[];
  return (data || []).map((job) => ({
    external_id: hashExternalId(job.text, job.hostedUrl),
    title: job.text,
    location: job.categories?.location,
    url: job.hostedUrl,
    apply_url: job.hostedUrl,
    description: job.description,
    posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
  }));
}
