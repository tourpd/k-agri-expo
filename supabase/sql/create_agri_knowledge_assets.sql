create extension if not exists pgcrypto;

create table if not exists agri_knowledge_assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null default '안이영자료',
  title text not null,
  crop text,
  disease_name text,
  source_name text,
  source_person text,
  file_url text,
  youtube_url text,
  summary text,
  keywords text,
  use_for text,
  status text default '사용중',
  priority int default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agri_knowledge_assets_type on agri_knowledge_assets(asset_type);
create index if not exists idx_agri_knowledge_assets_crop on agri_knowledge_assets(crop);
create index if not exists idx_agri_knowledge_assets_status on agri_knowledge_assets(status);
