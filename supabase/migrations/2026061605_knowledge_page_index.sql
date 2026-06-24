create table if not exists knowledge_page_index (
  id uuid primary key default gen_random_uuid(),

  job_id uuid,
  source_title text,
  file_type text,
  page_number integer,

  raw_text text,

  crop text,
  month_text text,
  growth_stage text,
  topic text,
  disease_name text,
  symptom text,
  cause text,
  countermeasure text,

  importance_score numeric default 0,
  farmer_value_score numeric default 0,
  content_score numeric default 0,
  shorts_score numeric default 0,
  broadcast_score numeric default 0,
  consulting_score numeric default 0,
  business_score numeric default 0,

  content_use text,
  writer_room_memo text,
  action_instruction text,

  thumbnail_url text,
  full_image_url text,

  status text default 'indexed',
  created_at timestamptz default now()
);

create index if not exists idx_knowledge_page_index_job
on knowledge_page_index(job_id);

create index if not exists idx_knowledge_page_index_crop
on knowledge_page_index(crop);

create index if not exists idx_knowledge_page_index_topic
on knowledge_page_index(topic);

create index if not exists idx_knowledge_page_index_score
on knowledge_page_index(importance_score desc);
