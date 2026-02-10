# AUVEA Job Assistant MVP

This is a Next.js + Supabase implementation of the AUVEA Job Assistant MVP.

## Setup

1. Create a Supabase project and run the SQL in `supabase/schema.sql`.
2. Create a private storage bucket named `resumes`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WORKER_SECRET` (shared secret for the worker endpoints)

## Development

```bash
npm install
npm run dev
```

## Cron

Vercel cron triggers `/api/cron/scrape` daily at 2:00 AM UTC by default. If you need per-user timezones, run the cron more frequently and gate by `last_scraped_at`.

## Notes

- Assisted apply is implemented as queue endpoints only. A Playwright worker should call the worker endpoints.
- The marketing landing page is rendered from the existing `index.html` with `styles.css` and `script.js` served from `public/`.
