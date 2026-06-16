create table if not exists public.knowledge_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text default 'ppt',
  author text,
  crop text,
  month text,
  raw_content text,
  ai_summary text,
  file_url text,
  youtube_url text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.knowledge_rules (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid references public.knowledge_assets(id) on delete cascade,
  crop text,
  month text,
  growth_stage text,
  symptom text,
  cause text,
  countermeasure text,
  action_instruction text,
  confidence_score numeric default 0.8,
  source_reference text,
  status text default 'approved',
  created_at timestamptz default now()
);

create index if not exists knowledge_assets_crop_idx on public.knowledge_assets(crop);
create index if not exists knowledge_assets_author_idx on public.knowledge_assets(author);
create index if not exists knowledge_rules_crop_month_idx on public.knowledge_rules(crop, month);
create index if not exists knowledge_rules_status_idx on public.knowledge_rules(status);
