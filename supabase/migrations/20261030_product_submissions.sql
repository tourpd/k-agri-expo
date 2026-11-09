-- 기업 셀프 제품 등록 (로그인 없이 /register 에서 제출 → 운영자 승인 → 문제 페이지·계산기 노출)
--
-- 적용: Supabase 대시보드 → SQL Editor → 이 파일 내용 붙여넣기 → Run
-- 적용 전에는 /register 제출이 "아직 준비 중" 안내만 내고, 나머지 화면은 영향 없음.

create table if not exists public.expo_product_submissions (
  id               uuid primary key default gen_random_uuid(),
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),

  -- 회사
  company_name     text not null,
  company_phone    text not null,
  company_email    text,
  contact_name     text,
  homepage_url     text,

  -- 제품
  product_name     text not null,
  product_group    text,                       -- 영양제 / 친환경 자재 / 비료 / 농기구 …
  feature          text,                       -- 한 줄 설명
  ingredients      text,
  crops            text[] not null default '{}',
  uses             text[] not null default '{}',  -- 진딧물, 응애, 열과 …
  problem_slugs    text[] not null default '{}',  -- 연결할 문제 페이지
  dose_rules       jsonb  not null default '[]',  -- [{kind:'dilution',ratio:1000,method:'엽면'} | {kind:'perArea',amount:500,unit:'ml',areaPyeong:750,waterL:500,method:'엽면'}]
  timing           text,
  cautions         text[] not null default '{}',
  packages         text[] not null default '{}',  -- '500ml','1L','2kg'
  price_krw        int,
  buy_url          text,                        -- 자사몰·스마트스토어 등
  image_url        text,
  organic_cert_no  text,                        -- 공시번호
  sellable         boolean not null default true, -- 농약(온라인 판매 불가)은 false

  -- 운영
  source_ip        text,
  admin_memo       text,
  approved_at      timestamptz,
  rejected_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists expo_product_submissions_status_idx on public.expo_product_submissions (status, created_at desc);
create index if not exists expo_product_submissions_problems_idx on public.expo_product_submissions using gin (problem_slugs);

alter table public.expo_product_submissions enable row level security;
-- 서비스 역할 키(서버)만 읽고 씁니다. 공개 정책은 두지 않습니다.
