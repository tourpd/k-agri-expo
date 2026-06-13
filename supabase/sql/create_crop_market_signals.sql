create table if not exists crop_market_signals (
  id uuid primary key default gen_random_uuid(),

  crop_name text not null,
  region_name text,
  standard_unit text,

  today_price numeric default 0,
  last_week_price numeric default 0,
  last_month_price numeric default 0,

  market_volume numeric default 0,
  volume_change_rate numeric default 0,

  import_risk integer default 0,
  government_risk integer default 0,
  oversupply_risk integer default 0,

  storage_level text,
  processing_demand text,
  export_demand text,

  farmer_report_count integer default 0,

  signal_status text default '관망',
  signal_color text default 'yellow',

  defense_price numeric default 0,
  negotiation_price numeric default 0,
  target_price numeric default 0,

  ai_summary text,
  ai_action text,
  data_sources text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists crop_field_reports (
  id uuid primary key default gen_random_uuid(),

  crop_name text not null,
  region_name text,
  reporter_name text,
  reporter_phone text,

  supply_status text,
  price_feeling text,
  harvest_status text,
  storage_status text,
  memo text,

  created_at timestamptz default now()
);

insert into crop_market_signals (
  crop_name,
  region_name,
  standard_unit,
  today_price,
  last_week_price,
  last_month_price,
  market_volume,
  volume_change_rate,
  import_risk,
  government_risk,
  oversupply_risk,
  storage_level,
  processing_demand,
  export_demand,
  farmer_report_count,
  signal_status,
  signal_color,
  defense_price,
  negotiation_price,
  target_price,
  ai_summary,
  ai_action,
  data_sources
)
values
(
  '홍산마늘',
  '전국',
  'kg',
  4500,
  4200,
  3900,
  170,
  -12,
  20,
  25,
  30,
  '보통',
  '높음',
  '보통',
  7,
  '강세',
  'green',
  4200,
  4700,
  5000,
  '현재 데이터 기준 상승 신호가 우세합니다. 다만 정부 수입·비축 개입 가능성은 계속 확인해야 합니다.',
  '분할판매 30%, 저장유지 40%, 바이어 제안 30%',
  '농민 등록가격, 산지 제보, 가락시장/KAMIS 연동 예정'
),
(
  '양파',
  '전국',
  'kg',
  1050,
  1150,
  1300,
  240,
  18,
  85,
  80,
  75,
  '많음',
  '보통',
  '낮음',
  12,
  '위험',
  'red',
  950,
  1150,
  1300,
  '중국산 유입과 정부 수급개입 가능성이 높아 단순 저장은 위험합니다.',
  '선별강화, 직거래 전환, 가공 검토',
  '농민 등록가격, 현장 제보, 수입위험 수동 입력'
),
(
  '오이',
  '강원 홍천',
  '20kg 상자',
  38000,
  52000,
  73000,
  310,
  42,
  10,
  20,
  90,
  '해당없음',
  '낮음',
  '낮음',
  21,
  '폭락주의',
  'red',
  30000,
  45000,
  60000,
  '홍천·강원권 출하 집중 신호가 높습니다. 과잉출하 시 가격 급락 위험이 있습니다.',
  '출하분산, 직거래 사전확보, 대량 바이어 연결 필요',
  '농민 현장 제보, 산지 출하량 입력'
)
on conflict do nothing;
