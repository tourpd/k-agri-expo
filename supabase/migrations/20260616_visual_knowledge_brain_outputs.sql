create table if not exists knowledge_decision_rules (
  id uuid primary key default gen_random_uuid(),
  source_visual_page_id uuid,
  source_title text,
  page_number integer,
  crop_name text,
  disease_name text,
  growth_stage text,
  rule_title text,
  trigger_condition text,
  action_instruction text,
  confidence integer default 70,
  status text default 'candidate',
  created_at timestamptz default now()
);

create table if not exists knowledge_broadcast_materials (
  id uuid primary key default gen_random_uuid(),
  source_visual_page_id uuid,
  source_title text,
  page_number integer,
  title text,
  angle text,
  key_message text,
  status text default 'candidate',
  created_at timestamptz default now()
);

create table if not exists knowledge_shorts_materials (
  id uuid primary key default gen_random_uuid(),
  source_visual_page_id uuid,
  source_title text,
  page_number integer,
  hook text,
  title text,
  script_outline text,
  status text default 'candidate',
  created_at timestamptz default now()
);

create table if not exists knowledge_farmer_consulting_answers (
  id uuid primary key default gen_random_uuid(),
  source_visual_page_id uuid,
  source_title text,
  page_number integer,
  crop_name text,
  disease_name text,
  question text,
  answer text,
  status text default 'candidate',
  created_at timestamptz default now()
);

create table if not exists knowledge_action_instructions (
  id uuid primary key default gen_random_uuid(),
  source_visual_page_id uuid,
  source_title text,
  page_number integer,
  crop_name text,
  disease_name text,
  action_title text,
  action_detail text,
  urgency text default 'normal',
  status text default 'candidate',
  created_at timestamptz default now()
);

create index if not exists idx_knowledge_decision_rules_source on knowledge_decision_rules(source_visual_page_id);
create index if not exists idx_knowledge_broadcast_materials_source on knowledge_broadcast_materials(source_visual_page_id);
create index if not exists idx_knowledge_shorts_materials_source on knowledge_shorts_materials(source_visual_page_id);
create index if not exists idx_knowledge_farmer_consulting_answers_source on knowledge_farmer_consulting_answers(source_visual_page_id);
create index if not exists idx_knowledge_action_instructions_source on knowledge_action_instructions(source_visual_page_id);
