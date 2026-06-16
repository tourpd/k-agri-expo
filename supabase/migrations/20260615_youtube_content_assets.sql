create table if not exists public.youtube_content_assets (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  title text not null,
  description text,
  thumbnail_url text,
  published_at timestamptz,
  channel_title text,
  video_url text,
  duration text,
  view_count bigint default 0,
  like_count bigint default 0,
  comment_count bigint default 0,
  crop text,
  month text,
  topic text,
  expert_name text,
  source_type text default 'youtube',
  asset_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists youtube_content_assets_title_idx
on public.youtube_content_assets using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

create index if not exists youtube_content_assets_crop_idx
on public.youtube_content_assets(crop);

create index if not exists youtube_content_assets_topic_idx
on public.youtube_content_assets(topic);

create index if not exists youtube_content_assets_published_idx
on public.youtube_content_assets(published_at desc);
