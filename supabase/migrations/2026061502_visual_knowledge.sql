create table if not exists public.knowledge_visual_pages (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text,
  image_url text not null unique,
  page_no int,
  visual_type text default 'unknown',
  crop text,
  disease_or_issue text,
  key_info text,
  ai_summary text,
  use_case text default '방송자료',
  status text default 'draft',
  created_at timestamptz default now()
);

create index if not exists idx_knowledge_visual_pages_source
on public.knowledge_visual_pages(source_name);

create index if not exists idx_knowledge_visual_pages_crop
on public.knowledge_visual_pages(crop);

create index if not exists idx_knowledge_visual_pages_type
on public.knowledge_visual_pages(visual_type);
