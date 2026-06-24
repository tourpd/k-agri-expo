create table if not exists knowledge_file_jobs (
  id uuid primary key default gen_random_uuid(),

  file_name text not null,
  file_type text,
  file_size bigint,

  status text default 'queued',
  stage text default '대기',
  progress integer default 0,

  total_pages integer default 0,
  processed_pages integer default 0,

  text_length integer default 0,
  image_count integer default 0,
  visual_inserted integer default 0,

  source_path text,
  pdf_path text,
  error_message text,

  result jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_knowledge_file_jobs_status
on knowledge_file_jobs(status);

create index if not exists idx_knowledge_file_jobs_created
on knowledge_file_jobs(created_at desc);
