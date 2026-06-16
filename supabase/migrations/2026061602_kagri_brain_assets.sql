-- =====================================================
-- K-AGRI 농업 두뇌센터
-- 이미지 자산
-- 콘텐츠 주제 자산
-- 작업 캘린더 자산
-- =====================================================

create table if not exists knowledge_images (
  id uuid primary key default gen_random_uuid(),

  knowledge_asset_id uuid,
  knowledge_rule_id uuid,

  crop text,
  disease_name text,
  symptom_name text,

  image_url text not null,

  source_slide integer,

  description text,
  tags text[],

  confidence_score numeric default 0,

  created_at timestamptz default now()
);

create index if not exists idx_knowledge_images_crop
on knowledge_images(crop);

create index if not exists idx_knowledge_images_disease
on knowledge_images(disease_name);

-- =====================================================

create table if not exists knowledge_topics (
  id uuid primary key default gen_random_uuid(),

  crop text,

  topic text not null,

  category text,

  source_rule_id uuid,

  content_score numeric default 0,

  youtube_title text,
  shorts_title text,
  news_title text,

  created_at timestamptz default now()
);

create index if not exists idx_knowledge_topics_crop
on knowledge_topics(crop);

create index if not exists idx_knowledge_topics_topic
on knowledge_topics(topic);

-- =====================================================

create table if not exists knowledge_calendar (
  id uuid primary key default gen_random_uuid(),

  crop text,

  month_text text,

  growth_stage text,

  task_title text,

  action_instruction text,

  priority_score numeric default 0,

  source_rule_id uuid,

  created_at timestamptz default now()
);

create index if not exists idx_knowledge_calendar_crop
on knowledge_calendar(crop);

create index if not exists idx_knowledge_calendar_month
on knowledge_calendar(month_text);

