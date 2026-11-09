-- 문제 해결 장터 (2주차에 적용 예정 — 1주차는 코드 안 목록(src/lib/problems/catalog.ts)으로 동작)
--
-- expo_problems           : 농민 문제 페이지 (작물·증상·원인·할 일·영상)
-- expo_problem_products   : 문제 ↔ 제품 연결 + 후원 자리
--
-- 적용 전까지는 아무 영향이 없습니다.

create table if not exists public.expo_problems (
  slug            text primary key,
  title           text not null,
  crop_key        text not null,
  symptom_keys    text[] not null default '{}',
  summary         text,
  cause           text,
  actions         text[] not null default '{}',
  principle       text,
  product_keywords text[] not null default '{}',
  no_products     boolean not null default false,
  seasonal        boolean not null default false,
  video_url       text,
  image_urls      text[] not null default '{}',
  source_label    text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.expo_problem_products (
  id              uuid primary key default gen_random_uuid(),
  problem_slug    text not null references public.expo_problems(slug) on delete cascade,
  product_source  text not null check (product_source in ('brand','booth')),
  product_id      text not null,
  vendor_id       text,
  booth_id        text,
  is_sponsor      boolean not null default false,   -- 문제 후원 (맨 위 자리)
  sponsor_until   date,
  sort_order      int not null default 100,
  approved_at     timestamptz,                      -- 운영자 승인 시각 (null이면 미노출)
  created_at      timestamptz not null default now(),
  unique (problem_slug, product_source, product_id)
);

create index if not exists expo_problem_products_problem_idx on public.expo_problem_products (problem_slug, is_sponsor desc, sort_order);

-- 문의 표에 문제 출처가 남도록 (이미 source / source_type 컬럼이 있어 변경 불필요)
--   source = 'problem:<slug>', source_type = 'problem'
