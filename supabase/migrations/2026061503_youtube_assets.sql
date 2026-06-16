create table if not exists youtube_assets (
  id uuid primary key default gen_random_uuid(),
  channel_name text not null,
  video_url text not null,
  title text not null,
  crop text,
  product_names text,
  expert_names text,
  transcript text,
  summary text,
  shorts_count int default 0,
  rule_count int default 0,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists youtube_asset_rules (
  id uuid primary key default gen_random_uuid(),
  youtube_asset_id uuid references youtube_assets(id) on delete cascade,
  crop text,
  month text,
  growth_stage text,
  symptom text,
  cause text,
  solution text,
  action_guide text,
  source_text text,
  confidence numeric default 0.8,
  created_at timestamptz default now()
);

create index if not exists idx_youtube_assets_channel on youtube_assets(channel_name);
create index if not exists idx_youtube_assets_crop on youtube_assets(crop);
create index if not exists idx_youtube_asset_rules_crop on youtube_asset_rules(crop);
