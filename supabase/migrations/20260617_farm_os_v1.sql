
create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  farm_name text,
  farmer_name text,
  crop text,
  variety text,
  region text,
  address text,
  area_py numeric,
  latitude numeric,
  longitude numeric,
  created_at timestamptz default now()
);

create table if not exists farm_photos (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  photo_url text,
  photo_type text,
  ai_summary text,
  created_at timestamptz default now()
);

create table if not exists farm_voice_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  audio_url text,
  transcript text,
  ai_summary text,
  created_at timestamptz default now()
);

create table if not exists farm_actions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  priority integer default 1,
  title text,
  reason text,
  action_instruction text,
  risk_score integer,
  status text default 'active',
  created_at timestamptz default now()
);

create index if not exists idx_farms_crop on farms(crop);
create index if not exists idx_farms_region on farms(region);

