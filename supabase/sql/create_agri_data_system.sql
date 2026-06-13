create table if not exists agri_price_data (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  region_name text default '전국',
  market_name text,
  source_name text,
  unit text,
  price numeric default 0,
  high_price numeric default 0,
  low_price numeric default 0,
  avg_price numeric default 0,
  volume numeric default 0,
  trade_date date default current_date,
  confidence_percent integer default 0,
  raw_data jsonb,
  created_at timestamptz default now()
);

create table if not exists agri_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text,
  source_url text,
  country text default 'KR',
  crop_name text,
  category text,
  summary text,
  risk_percent integer default 0,
  opportunity_percent integer default 0,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists agri_policy (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text default '농림축산식품부',
  crop_name text,
  policy_type text,
  summary text,
  impact_direction text default 'neutral',
  impact_percent integer default 0,
  published_at timestamptz,
  source_url text,
  created_at timestamptz default now()
);

create table if not exists agri_weather (
  id uuid primary key default gen_random_uuid(),
  crop_name text,
  region_name text,
  weather_type text,
  risk_percent integer default 0,
  summary text,
  forecast_date date,
  source_name text default '기상청',
  created_at timestamptz default now()
);

create table if not exists agri_import_export (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  country text,
  import_volume numeric default 0,
  export_volume numeric default 0,
  price_signal text,
  risk_percent integer default 0,
  summary text,
  data_month text,
  source_name text,
  created_at timestamptz default now()
);

create table if not exists agri_china_market (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  china_region text,
  china_price numeric default 0,
  production_signal text,
  export_signal text,
  risk_percent integer default 0,
  summary text,
  source_name text default '중국 농산물 동향',
  checked_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists agri_usda (
  id uuid primary key default gen_random_uuid(),
  crop_name text,
  report_type text,
  global_signal text,
  risk_percent integer default 0,
  opportunity_percent integer default 0,
  summary text,
  source_name text default 'USDA/FAO',
  published_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists agri_consumer (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  channel_name text,
  demand_signal text,
  demand_percent integer default 0,
  summary text,
  source_name text,
  created_at timestamptz default now()
);

create table if not exists agri_farmer_reports (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  region_name text,
  farmer_name text,
  phone text,
  unit text,
  actual_price numeric default 0,
  quantity numeric default 0,
  report_type text,
  memo text,
  reliability_percent integer default 50,
  created_at timestamptz default now()
);

create table if not exists agri_processing_opportunity (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  trigger_reason text,
  product_idea text,
  raw_material_form text,
  processing_method text,
  target_buyer text,
  farmer_rescue_reason text,
  opportunity_percent integer default 0,
  urgency_percent integer default 0,
  status text default '후보',
  created_at timestamptz default now()
);

create table if not exists agri_kffr_opportunity (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  functional_keyword text,
  product_concept text,
  hanmi_reason text,
  kffr_reason text,
  farmer_rescue_reason text,
  raw_material_form text,
  priority_percent integer default 0,
  evidence_summary text,
  next_action text,
  status text default '후보',
  created_at timestamptz default now()
);

insert into agri_processing_opportunity
(crop_name, trigger_reason, product_idea, raw_material_form, processing_method, target_buyer, farmer_rescue_reason, opportunity_percent, urgency_percent, status)
values
('오이','가격폭락·출하집중','오이워터, 오이분말, 이너뷰티 음료','착즙, 동결건조분말','착즙/농축/동결건조','KFFR, 한미양행, 이너뷰티 브랜드','저장성이 낮은 오이 폭락 물량을 가공 원료로 흡수',72,92,'후보'),
('양파','가격폭락·수입압박','양파즙, 양파분말, 퀘르세틴 원료','즙, 분말, 농축액','착즙/건조/분말화','한미양행, 건강식품 제조사','수입압박이 큰 양파 농가에 원료 수매 안전판 제공',82,85,'후보'),
('마늘','가격하락·저장마늘 부담','흑마늘, 발효마늘, 마늘환','흑마늘, 발효농축액, 분말','발효/숙성/농축','한미양행, KFFR','저장마늘을 고부가 건강원료로 전환',92,88,'우선검토'),
('감귤','과잉·비상품과','감귤분말, 이너뷰티 젤리, 항산화 원료','과육분말, 껍질추출물','건조/추출/분말','한미양행, 이너뷰티 브랜드','비상품 감귤을 기능성 원료로 전환',86,70,'후보'),
('레드향','과잉·프리미엄 선별탈락','레드향 플라보노이드 젤리/분말','과육분말, 껍질추출물','건조/추출/분말','프리미엄 건강식품 브랜드','선별탈락 과실의 부가가치화',84,68,'후보'),
('브로콜리','과잉·수입경쟁','브로콜리 설포라판 분말, 환','동결건조분말','건조/분말/캡슐화','한미양행, KFFR','과잉 브로콜리를 건강식 원료로 전환',88,72,'후보')
on conflict do nothing;

insert into agri_kffr_opportunity
(crop_name, functional_keyword, product_concept, hanmi_reason, kffr_reason, farmer_rescue_reason, raw_material_form, priority_percent, evidence_summary, next_action, status)
values
('마늘','알리신·발효·면역·활력','홍산마늘 흑마늘 스틱/환/분말','마늘 기능성 이미지와 건강식품 제조 적합성 높음','국산 품종 독립과 미래식량 자원화 스토리 강함','마늘 가격하락 시 저장물량을 고부가 원료로 수매 가능','흑마늘, 발효농축액, 분말',98,'마늘은 소비자 인지도가 높고 홍산마늘 스토리 자산이 큼','홍산마늘 원료화 1차 회의 제안','최우선'),
('양파','퀘르세틴·항산화·혈행','양파 퀘르세틴 분말/즙','양파즙·분말 제품화 가능','가격폭락 작물의 자원화 모델로 적합','수입압박·가격폭락 시 수매 안전판 역할','양파즙, 양파분말, 농축액',88,'양파는 가격 변동과 수입압박이 큰 품목','가격폭락 구간 원료 매입 시뮬레이션','후보'),
('오이','수분·저칼로리·피부·이너뷰티','오이워터, 오이분말, 이너뷰티 음료','이너뷰티·저칼로리 음료 콘셉트 가능','저장불가 폭락 작물 구조 개선에 적합','홍천 오이 같은 폭락 피해 완충 가능','착즙, 동결건조분말',82,'오이는 폭락 시 가공 전환 필요성이 매우 큼','홍천 오이 가공 테스트 검토','후보'),
('감귤','비타민C·플라보노이드·항산화','감귤 이너뷰티 젤리/분말','비타민·항산화 제품화 쉬움','제주 비상품과 자원화 가능','비상품 감귤 농가 부가가치화','과육분말, 껍질추출물',86,'감귤은 기능성 스토리와 소비자 이해도가 높음','제주 감귤 원료 공급처 조사','후보'),
('레드향','프리미엄 감귤·항산화','레드향 프리미엄 이너뷰티 젤리','프리미엄 브랜드 제품화 가능','고급 과일 부산물 활용 모델 가능','선별탈락 과실 수매로 농가 지원','과육분말, 껍질추출물',84,'레드향은 고급 이미지가 있어 제품 스토리화 쉬움','만감류 원료화 가능성 조사','후보'),
('브로콜리','설포라판·항산화','브로콜리 설포라판 분말/환','건강식품 소재화 가능성 높음','미래 건강 원료로 스토리 명확','과잉 생산 시 가공수요 창출','동결건조분말',88,'설포라판 콘셉트는 소비자 인지도가 높음','원료 표준화 가능성 검토','후보')
on conflict do nothing;
