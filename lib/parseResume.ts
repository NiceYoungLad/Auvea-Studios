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

export async function parseResume(buffer: Buffer): Promise<ParsedResume> {
  const data = await pdf(buffer);
  const text = data.text || '';

  const email = (text.match(emailRegex) || [])[0];
  const phone = (text.match(phoneRegex) || [])[0];
  const linkedin = (text.match(linkedinRegex) || [])[0];

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = lines[0];

  const skillsLine = lines.find((line) => line.toLowerCase().startsWith('skills'));
  const skills = skillsLine ? skillsLine.split(':')[1]?.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return {
    name,
    email,
    phone,
    linkedin,
    skills,
    rawText: text,
  };
}
