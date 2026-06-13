create table if not exists agri_collection_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text default 'manual',
  status text default 'started',
  collected_price_count integer default 0,
  collected_news_count integer default 0,
  collected_policy_count integer default 0,
  collected_weather_count integer default 0,
  error_message text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists agri_api_credentials_status (
  id uuid primary key default gen_random_uuid(),
  api_name text not null,
  required_env_key text not null,
  status text default 'not_checked',
  message text,
  checked_at timestamptz default now()
);
