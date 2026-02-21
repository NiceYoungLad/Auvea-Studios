import { hashExternalId, type ScrapedJob } from './scrape';

const ENTRY_LEVEL_PREFIXES = ['Junior', 'Entry Level', 'Graduate', 'Associate', 'Trainee'];

// Common tech skill → matching job title
const SKILL_TO_TITLE: Record<string, string> = {
  react: 'Frontend Developer',
  'react.js': 'Frontend Developer',
  reactjs: 'Frontend Developer',
  vue: 'Frontend Developer',
  angular: 'Frontend Developer',
  javascript: 'JavaScript Developer',
  typescript: 'TypeScript Developer',
  html: 'Web Developer',
  css: 'Web Developer',
  node: 'Backend Developer',
  'node.js': 'Backend Developer',
  nodejs: 'Backend Developer',
  express: 'Backend Developer',
  python: 'Python Developer',
  django: 'Python Developer',
  flask: 'Python Developer',
  java: 'Java Developer',
  spring: 'Java Developer',
  kotlin: 'Android Developer',
  swift: 'iOS Developer',
  flutter: 'Mobile Developer',
  'react native': 'Mobile Developer',
  go: 'Golang Developer',
  golang: 'Golang Developer',
  rust: 'Systems Developer',
  c: 'C Developer',
  'c++': 'C++ Developer',
  'c#': '.NET Developer',
  dotnet: '.NET Developer',
  '.net': '.NET Developer',
  php: 'PHP Developer',
  laravel: 'PHP Developer',
  ruby: 'Ruby Developer',
  rails: 'Ruby Developer',
  sql: 'Database Developer',
  postgresql: 'Database Developer',
  mysql: 'Database Developer',
  mongodb: 'Backend Developer',
  aws: 'Cloud Engineer',
  azure: 'Cloud Engineer',
  gcp: 'Cloud Engineer',
  devops: 'DevOps Engineer',
  docker: 'DevOps Engineer',
  kubernetes: 'DevOps Engineer',
  terraform: 'DevOps Engineer',
  linux: 'Systems Engineer',
  networking: 'Network Engineer',
  cybersecurity: 'Security Engineer',
  'machine learning': 'Machine Learning Engineer',
  ml: 'Machine Learning Engineer',
  ai: 'AI Engineer',
  'data science': 'Data Scientist',
  pandas: 'Data Analyst',
  numpy: 'Data Analyst',
  tableau: 'Data Analyst',
  'power bi': 'Data Analyst',
  figma: 'UI/UX Designer',
  photoshop: 'UI/UX Designer',
  sketch: 'UI/UX Designer',
  ui: 'UI/UX Designer',
  ux: 'UI/UX Designer',
  testing: 'QA Engineer',
  selenium: 'QA Engineer',
  qa: 'QA Engineer',
};

/**
 * Given parsed resume JSON, extract 3-5 entry-level job title queries.
 * e.g. "Junior React Developer", "Entry Level Python Developer"
 */
export function extractEntryLevelJobTitles(parsedJson: any): string[] {
  const skills: string[] = Array.isArray(parsedJson?.skills)
    ? parsedJson.skills.map((s: string) => s.toLowerCase().trim())
    : [];

  // Also scan raw text for common role keywords
  const rawText: string = typeof parsedJson?.rawText === 'string'
    ? parsedJson.rawText.toLowerCase()
    : '';

  const matchedTitles = new Set<string>();

  // Try multi-word skills first (more specific)
  for (const [skill, title] of Object.entries(SKILL_TO_TITLE)) {
    if (skills.some((s) => s.includes(skill)) || rawText.includes(skill)) {
      matchedTitles.add(title);
      if (matchedTitles.size >= 4) break;
    }
  }

  // Fallback if nothing matched
  if (matchedTitles.size === 0) {
    matchedTitles.add('Software Engineer');
    matchedTitles.add('Web Developer');
  }

  const titles: string[] = [];
  for (const title of matchedTitles) {
    // Pick a random prefix for variety across titles
    const prefix = ENTRY_LEVEL_PREFIXES[titles.length % ENTRY_LEVEL_PREFIXES.length];
    titles.push(`${prefix} ${title}`);
    if (titles.length >= 5) break;
  }

  return titles;
}

/**
 * Extract country from the parsed resume location field.
 * e.g. "Kuala Lumpur, Malaysia" → "Malaysia"
 */
export function extractCountryFromResume(parsedJson: any): string | undefined {
  const location: string = typeof parsedJson?.location === 'string'
    ? parsedJson.location.trim()
    : '';

  if (!location) return undefined;

  // "City, Country" or just "Country"
  const parts = location.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || undefined;
}

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  url: string;
  description: string;
  publication_date: string;
};

/**
 * Search Remotive for jobs matching given entry-level titles and optionally a country.
 * Returns up to 50 unique jobs.
 */
export async function discoverJobsByTitlesAndCountry(
  titles: string[],
  country?: string
): Promise<ScrapedJob[]> {
  const collected: ScrapedJob[] = [];

  for (const title of titles.slice(0, 5)) {
    let url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(title)}&limit=20`;
    if (country) {
      url += `&location=${encodeURIComponent(country)}`;
    }

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) continue;

    const data = (await response.json()) as { jobs?: RemotiveJob[] };
    const jobs = data.jobs || [];

    for (const job of jobs.slice(0, 15)) {
      if (!job.title || !job.url) continue;

      // If country is set, do a loose client-side filter as Remotive location param is fuzzy
      if (country) {
        const loc = (job.candidate_required_location || '').toLowerCase();
        const countryLower = country.toLowerCase();
        // Accept if location mentions the country, or is "worldwide"/"remote"/"anywhere"
        const isGlobal = ['worldwide', 'remote', 'anywhere', 'global'].some((k) => loc.includes(k));
        if (!isGlobal && !loc.includes(countryLower)) continue;
      }

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

  // Deduplicate by external_id
  const unique = new Map<string, ScrapedJob>();
  for (const job of collected) {
    if (!unique.has(job.external_id)) {
      unique.set(job.external_id, job);
    }
  }

  return Array.from(unique.values()).slice(0, 50);
}
