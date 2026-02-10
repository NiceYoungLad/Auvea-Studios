create extension if not exists "pgcrypto";

do $$ begin
  create type job_status as enum ('new', 'seen', 'applied', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('queued', 'running', 'needs_input', 'needs_review', 'submitted', 'manual_required', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scraper_type as enum ('manual', 'greenhouse', 'lever');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  storage_path text not null,
  parsed_json jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  career_url text not null,
  scraper_type scraper_type not null,
  selectors_json jsonb,
  enabled boolean default true,
  last_scraped_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies on delete cascade not null,
  external_id text not null,
  title text not null,
  location text,
  url text not null,
  posted_at text,
  description text,
  apply_url text,
  scraped_at timestamptz default now(),
  status job_status default 'new',
  unique (company_id, external_id)
);

create table if not exists scrape_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies on delete cascade not null,
  run_at timestamptz default now(),
  status text,
  error text
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references jobs on delete cascade not null,
  status application_status default 'queued',
  started_at timestamptz default now(),
  submitted_at timestamptz,
  error text,
  review_required boolean default true
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  normalized_text text not null,
  answer_type text,
  answer_value_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, normalized_text)
);

create table if not exists application_questions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications on delete cascade not null,
  question_text text not null,
  normalized_text text,
  answer_value_json jsonb,
  resolved boolean default false
);

alter table profiles enable row level security;
alter table resumes enable row level security;
alter table companies enable row level security;
alter table jobs enable row level security;
alter table scrape_runs enable row level security;
alter table applications enable row level security;
alter table questions enable row level security;
alter table application_questions enable row level security;

create policy "Profiles are readable by owner" on profiles
  for select using (auth.uid() = id);
create policy "Profiles are writable by owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Resumes are readable by owner" on resumes
  for select using (auth.uid() = user_id);
create policy "Resumes are writable by owner" on resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Companies are readable by owner" on companies
  for select using (auth.uid() = user_id);
create policy "Companies are writable by owner" on companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Jobs are readable by company owner" on jobs
  for select using (
    exists (
      select 1 from companies
      where companies.id = jobs.company_id
        and companies.user_id = auth.uid()
    )
  );

create policy "Jobs are writable by company owner" on jobs
  for all using (
    exists (
      select 1 from companies
      where companies.id = jobs.company_id
        and companies.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from companies
      where companies.id = jobs.company_id
        and companies.user_id = auth.uid()
    )
  );

create policy "Scrape runs readable by company owner" on scrape_runs
  for select using (
    exists (
      select 1 from companies
      where companies.id = scrape_runs.company_id
        and companies.user_id = auth.uid()
    )
  );

create policy "Scrape runs writable by company owner" on scrape_runs
  for all using (
    exists (
      select 1 from companies
      where companies.id = scrape_runs.company_id
        and companies.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from companies
      where companies.id = scrape_runs.company_id
        and companies.user_id = auth.uid()
    )
  );

create policy "Applications readable by owner" on applications
  for select using (auth.uid() = user_id);
create policy "Applications writable by owner" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Questions readable by owner" on questions
  for select using (auth.uid() = user_id);
create policy "Questions writable by owner" on questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Application questions readable by owner" on application_questions
  for select using (
    exists (
      select 1 from applications
      where applications.id = application_questions.application_id
        and applications.user_id = auth.uid()
    )
  );

create policy "Application questions writable by owner" on application_questions
  for all using (
    exists (
      select 1 from applications
      where applications.id = application_questions.application_id
        and applications.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from applications
      where applications.id = application_questions.application_id
        and applications.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
