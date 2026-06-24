
-- =========================
-- PHOTO DOCTOR (진단 로그)
-- =========================
create table if not exists diagnosis_logs (
  id uuid primary key default gen_random_uuid(),
  crop text,
  province text,
  city text,
  image_url text,
  cause_1_name text,
  cause_1_prob float,
  cause_2_name text,
  cause_2_prob float,
  device_id text,
  created_at timestamp default now()
);

-- =========================
-- FEEDBACK (AI 학습)
-- =========================
create table if not exists diagnosis_feedback (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid,
  is_correct boolean,
  correct_cause text,
  comment text,
  created_at timestamp default now()
);

-- =========================
-- PRODUCT MAP (처방 엔진)
-- =========================
create table if not exists product_mapping (
  id uuid primary key default gen_random_uuid(),
  cause_name text,
  product_name text,
  priority int default 1
);

-- =========================
-- ORDERS (EXPO 거래)
-- =========================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_phone text,
  product_name text,
  quantity int,
  price int,
  status text default 'pending',
  created_at timestamp default now()
);

-- =========================
-- CRM EVENTS (OS 로그)
-- =========================
create table if not exists crm_events (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  user_phone text,
  ref_id text,
  metadata jsonb,
  created_at timestamp default now()
);

