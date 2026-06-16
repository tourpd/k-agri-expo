create table if not exists public.ai_broadcast_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_file_name text,
  crop text,
  month text,
  expert_name text,
  topic text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.ai_broadcast_subtitles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.ai_broadcast_projects(id) on delete cascade,
  sort_order int,
  start_time text,
  end_time text,
  original_text text,
  corrected_text text,
  entertainment_caption text,
  subtitle_type text default 'basic',
  crop text,
  topic text,
  is_approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.ai_subtitle_glossary (
  id uuid primary key default gen_random_uuid(),
  wrong_text text not null,
  correct_text text not null,
  category text,
  memo text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.ai_reference_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  asset_type text,
  crop text,
  topic text,
  source_name text,
  file_url text,
  summary text,
  usage_hint text,
  created_at timestamptz default now()
);

insert into public.ai_subtitle_glossary (wrong_text, correct_text, category, memo)
values
('연면십이', '엽면시비', '농업용어', '음성인식 교정'),
('엽면시위', '엽면시비', '농업용어', '음성인식 교정'),
('제충박사', '제균박사', '제품명', '도프 제품명 교정'),
('제충박스', '제균박사', '제품명', '도프 제품명 교정'),
('케이플라스', 'K-PLUS', '제품명', '제품명 표준화'),
('케이 플러스', 'K-PLUS', '제품명', '제품명 표준화'),
('K 플러스', 'K-PLUS', '제품명', '제품명 표준화'),
('아미 육십오', '아미65', '제품명', '제품명 표준화')
on conflict do nothing;
