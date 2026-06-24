create table if not exists public.writers_room_recommendations (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  content_type text not null default 'broadcast',

  source_job_id uuid,
  source_page_id uuid,

  reason text,
  score numeric default 0,
  expected_views integer default 0,

  status text not null default 'recommended',

  approved_by text,
  approved_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_writers_room_status
on public.writers_room_recommendations(status);

create index if not exists idx_writers_room_score
on public.writers_room_recommendations(score desc);

create index if not exists idx_writers_room_content_type
on public.writers_room_recommendations(content_type);
