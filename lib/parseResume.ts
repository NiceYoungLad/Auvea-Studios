import pdf from 'pdf-parse';

export type ParsedResume = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  skills?: string[];
  rawText: string;
};

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/g;
const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/[A-Za-z0-9_-]+/gi;

// Matches patterns like "City, State" or "City, Country" or "City, State, Country"
// Also matches standalone country names like "Malaysia", "Singapore", "United States"
const locationRegex =
  /\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+(,\s*[A-Z][a-zA-Z\s]+)?)\b/g;

// Common country names for standalone detection
const KNOWN_COUNTRIES = [
  'Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Philippines',
  'Vietnam', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka',
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'New Zealand', 'Germany', 'France', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Switzerland', 'Japan',
  'South Korea', 'China', 'Taiwan', 'Hong Kong', 'UAE',
  'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Ghana',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia',
];

function extractLocation(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Check first 10 lines for "City, Country" pattern — most resumes have it near the top
  for (const line of lines.slice(0, 10)) {
    const match = line.match(locationRegex);
    if (match && match[0].length > 4) {
      return match[0].trim();
    }
    // Check for known country name on its own line
    for (const country of KNOWN_COUNTRIES) {
      if (line.toLowerCase().includes(country.toLowerCase())) {
        return country;
      }
    }
  }

  // 2. Scan full text for known countries as fallback
  const textLower = text.toLowerCase();
  for (const country of KNOWN_COUNTRIES) {
    if (textLower.includes(country.toLowerCase())) {
      return country;
    }
  }

  return undefined;
}

export async function parseResume(buffer: Buffer): Promise<ParsedResume> {
  const data = await pdf(buffer);
  const text = data.text || '';

  const email = (text.match(emailRegex) || [])[0];
  const phone = (text.match(phoneRegex) || [])[0];
  const linkedin = (text.match(linkedinRegex) || [])[0];
  const location = extractLocation(text);

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = lines[0];

  const skillsLine = lines.find((line) => line.toLowerCase().startsWith('skills'));
  const skills = skillsLine
    ? skillsLine.split(':')[1]?.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    name,
    email,
    phone,
    linkedin,
    location,
    skills,
    rawText: text,
  };
}
