import { hashExternalId, type ScrapedJob } from './scrape';

const STOPWORDS = new Set([
  'with',
  'from',
  'that',
  'this',
  'have',
  'your',
  'will',
  'about',
  'experience',
  'years',
  'email',
  'phone',
  'linkedin',
  'skills',
  'summary',
  'work',
  'project',
  'projects',
  'using',
  'build',
  'built',
  'team',
  'role',
  'responsible',
]);

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  url: string;
  description: string;
  publication_date: string;
};

export function extractSearchTerms(parsedJson: any): string[] {
  const terms: string[] = [];
  const skills = Array.isArray(parsedJson?.skills) ? parsedJson.skills : [];

  for (const skill of skills) {
    if (typeof skill === 'string' && skill.trim().length >= 3) {
      terms.push(skill.trim().toLowerCase());
    }
  }

  const rawText = typeof parsedJson?.rawText === 'string' ? parsedJson.rawText : '';
  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word: string) => word.length >= 4 && !STOPWORDS.has(word));

  for (const word of words) {
    if (terms.length >= 8) break;
    if (!terms.includes(word)) terms.push(word);
  }

  if (terms.length === 0) {
    return ['software engineer', 'developer', 'frontend'];
  }

  return terms.slice(0, 5);
}

export async function discoverJobsFromTerms(terms: string[]): Promise<ScrapedJob[]> {
  const collected: ScrapedJob[] = [];

  for (const term of terms.slice(0, 5)) {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) continue;
    const data = (await response.json()) as { jobs?: RemotiveJob[] };
    const jobs = data.jobs || [];

    for (const job of jobs.slice(0, 15)) {
      if (!job.title || !job.url) continue;
      collected.push({
        external_id: hashExternalId(job.title, job.url),
        title: job.title,
        location: job.candidate_required_location || 'Remote',
        url: job.url,
        apply_url: job.url,
        description: job.description,
        posted_at: job.publication_date,
      });
    }
  }

  const uniqueByExternalId = new Map<string, ScrapedJob>();
  for (const job of collected) {
    if (!uniqueByExternalId.has(job.external_id)) {
      uniqueByExternalId.set(job.external_id, job);
    }
  }

  return Array.from(uniqueByExternalId.values()).slice(0, 60);
}
