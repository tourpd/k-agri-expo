alter table crop_market_signals
add column if not exists evidence_count integer default 0,
add column if not exists data_confidence_percent integer default 0,
add column if not exists public_data_percent integer default 0,
add column if not exists field_data_percent integer default 0,
add column if not exists global_data_percent integer default 0,
add column if not exists consumer_data_percent integer default 0,
add column if not exists breed_story text,
add column if not exists risk_summary text,
add column if not exists action_options text,
add column if not exists last_evidence_checked_at timestamptz;

create table if not exists agri_data_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  source_grade text default 'B',
  source_url text,
  description text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists crop_price_evidence (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  region_name text default '전국',
  evidence_type text not null,
  source_name text not null,
  source_grade text default 'B',
  signal_direction text default 'neutral',
  weight_percent numeric default 0,
  confidence_percent numeric default 0,
  value_text text,
  summary text,
  created_at timestamptz default now()
);

insert into agri_data_sources
(source_name, source_type, source_grade, source_url, description)
values
('KAMIS','국내가격','A','https://www.kamis.or.kr','aT 농산물 도매·소매 가격'),
('가락시장','국내가격','A','https://www.garak.co.kr','경락가·반입량'),
('농넷','국내가격','A','https://www.nongnet.or.kr','농산물 유통 종합정보'),
('농림축산식품부','정부정책','A','https://www.mafra.go.kr','수급대책·TRQ·비축·수입정책'),
('농사로','재배기술','A','https://www.nongsaro.go.kr','농진청 재배·병해충·작황정보'),
('기상청','기후','A','https://www.weather.go.kr','폭염·태풍·가뭄·한파'),
('중국 농산물 동향','해외','B',null,'중국 생산·수입·작황·가격 뉴스'),
('USDA/FAO','해외','A',null,'국제 농산물 수급·식량시장'),
('소비시장','소비','B',null,'대형마트·급식·외식·온라인 수요'),
('K-AGRI 현장데이터','현장','C',null,'농민 실거래·저장물량·출하 제보'),
('K-AGRI 거래소','거래','B',null,'바이어 관심·거래제안·등록물량')
on conflict do nothing;

insert into crop_market_signals (
  crop_name, region_name, standard_unit,
  today_price, last_week_price, last_month_price,
  import_risk, government_risk, oversupply_risk,
  signal_status, signal_color,
  defense_price, negotiation_price, target_price,
  ai_summary, ai_action, data_sources,
  evidence_count, data_confidence_percent, public_data_percent, field_data_percent, global_data_percent, consumer_data_percent,
  breed_story, risk_summary, action_options, last_evidence_checked_at
)
values
('홍산마늘','전국','kg',4500,4200,3900,20,25,30,'강세','green',4200,4700,5000,
'국산 품종 가치와 저장성, 기능성, 브랜드 스토리가 강한 보호작물입니다.',
'급매보다 바이어 제안, 브랜드화, 공동판매 검토',
'KAMIS, 가락시장, 농진청 품종자료, K-AGRI 현장데이터',
9,86,90,76,65,60,
'홍산마늘은 농촌진흥청이 개발한 국산 품종으로, K-AGRI의 대표 보호작물입니다. 대서·남도 중심의 종구 의존 구조 속에서 국산 품종 독립의 상징으로 관리합니다.',
'수입마늘·대서마늘 가격경쟁보다 홍산마늘의 품종 가치와 스토리 부족이 더 큰 위험입니다.',
'브랜드화 | 공동판매 | 바이어 제안 | 홍산마늘 캠페인 | 영상 콘텐츠 연결',now()),

('대서마늘','전국','kg',3600,3700,3900,70,60,55,'주의','yellow',3300,3800,4200,
'국내 재배 비중이 높지만 수입산·종구 의존성과 가격경쟁 압박이 있습니다.',
'규격·물량 중심 거래 검토',
'KAMIS, 가락시장, 품종자료, 중국 동향',
6,76,86,55,70,45,
'스페인 도입계로 알려진 품종군입니다. 국내 생산 현장에서는 대량재배와 규격성 장점이 있지만 국산 품종 독립 이슈와 함께 봐야 합니다.',
'중국 종구·수입마늘 가격에 영향받을 가능성이 있습니다.',
'규격선별 | 대량거래 | 수입동향 확인 | 홍산마늘과 차별화',now()),

('남도마늘','전국','kg',3400,3500,3700,75,62,58,'주의','yellow',3100,3600,4000,
'중국 도입계 품종 이슈와 수입산 압박을 함께 봐야 합니다.',
'저장물량과 수입동향 확인 후 분할판매',
'KAMIS, 가락시장, 품종자료',
5,75,86,50,72,40,
'남도마늘은 국내 마늘 시장에서 널리 재배되어 왔지만, 도입 품종 구조와 수입산 압박을 함께 봐야 합니다.',
'가격 경쟁 구간에서는 국산 품종 스토리가 약할 수 있습니다.',
'분할판매 | 저장비용 확인 | 수입마늘 동향 확인',now()),

('양파','전국','kg',1050,1150,1300,85,80,75,'위험','red',950,1150,1300,
'중국산 유입, 정부 수급개입, 저장물량 부담이 큰 품목입니다.',
'선별강화, 직거래, 가공 전환 검토',
'KAMIS, 가락시장, 농식품부, 중국 동향',
8,82,90,65,78,55,
'양파는 수입·TRQ·정부수급대책에 민감한 대표 품목입니다.',
'가격 상승 시 수입 또는 정부개입 가능성이 농가 가격 방어에 부담이 됩니다.',
'선별강화 | 직거래 | 가공전환 | 저장비용 점검',now()),

('오이','강원 홍천','20kg',38000,52000,73000,10,20,90,'폭락주의','red',30000,45000,60000,
'홍천·고랭지 출하 집중 시 급락 위험이 큽니다. 저장이 어려워 조기경보가 중요합니다.',
'출하분산, 직거래 확보, 공동판매 검토',
'가락시장, 현장제보, 기상청',
7,82,88,75,30,40,
'홍천 내면 오이는 특정 시기에 대한민국 시장 공급을 크게 좌우할 수 있는 상징 품목입니다.',
'저장성이 낮고 출하가 몰리면 가격이 급락할 수 있습니다.',
'출하분산 | 직거래 확보 | 공동판매 | 대형 바이어 사전연결',now()),

('배추','전국','포기',2800,2650,3000,20,85,70,'위험','red',2300,3000,3600,
'정부 비축·수급대책에 민감하고 날씨 영향이 큽니다.',
'정부 발표와 산지 출하량 확인',
'KAMIS, 농식품부, 기상청',
6,82,92,55,40,60,
'배추는 김치·생활물가와 연결되어 정부개입 위험이 큰 품목입니다.',
'가격 급등 시 비축물량 방출이나 수급대책 가능성이 있습니다.',
'출하분산 | 정부 발표 확인 | 김치공장 수요 확인',now()),

('꽈리고추','전국','kg',8500,8000,7600,20,20,30,'관망','yellow',7600,9000,10000,
'요식업 수요와 출하량에 따라 단기 변동이 큽니다.',
'소량 고품질 판매처 확보',
'KAMIS, 가락시장, 현장제보',
4,72,82,50,30,45,
'꽈리고추는 외식·반찬 수요에 민감합니다.',
'출하량이 몰리면 단기 가격 흔들림이 큽니다.',
'식당납품 | 품질선별 | 소량직거래',now()),

('당조고추','전국','kg',12000,11500,10800,5,10,25,'관망','yellow',10500,13000,15000,
'기능성 고추로 일반 고추와 다른 소비자 타깃이 필요합니다.',
'건강·기능성 스토리 판매 검토',
'기능성작물, 현장제보, 소비동향',
4,68,70,55,30,70,
'당조고추는 기능성 스토리를 가진 특화작물입니다.',
'일반 고추 가격표보다 건강·기능성 소비시장과 연결해야 합니다.',
'기능성 홍보 | 건강식품 연계 | 직거래 | 콘텐츠화',now()),

('상추','전국','kg',5200,4800,4200,5,15,35,'강세','green',4500,5500,6200,
'기상 악화 시 단기 급등락이 큽니다.',
'단기 시세 확인 후 판매',
'KAMIS, 기상청',
4,76,85,50,20,65,
'상추는 기상과 출하량에 따라 가격 변동이 빠른 품목입니다.',
'폭염·장마 시 단기 급등락 가능성이 있습니다.',
'당일가격 확인 | 빠른출하 | 품질선별',now()),

('브로콜리','전국','kg',4200,3900,3600,35,30,40,'관망','yellow',3600,4500,5200,
'수입 브로콜리와 국내 출하량을 함께 봐야 합니다.',
'수입동향 확인 후 판매',
'KAMIS, 수입동향, 가락시장',
4,74,82,45,55,55,
'브로콜리는 수입산과 국내산 신선도 경쟁이 중요합니다.',
'수입가격과 국내 출하량을 같이 봐야 합니다.',
'수입동향 확인 | 신선도 강조 | 급식납품',now()),

('감귤','제주','kg',2200,2100,2000,10,20,45,'관망','yellow',1900,2400,2800,
'제주 출하량과 당도, 대체과일 가격이 중요합니다.',
'당도 선별·직거래 검토',
'KAMIS, 제주출하, 기상청',
5,76,84,50,30,70,
'감귤은 제주 출하량, 당도, 대체과일 가격의 영향을 받습니다.',
'품질 격차가 가격 차이를 만듭니다.',
'당도선별 | 직거래 | 선물세트 | 온라인판매',now()),

('레드향','제주','kg',6800,6500,6200,10,15,35,'관망','yellow',5800,7200,8500,
'프리미엄 만감류로 당도·선물수요가 가격을 좌우합니다.',
'고당도 선별, 선물세트 판매',
'제주출하, 소비동향',
4,70,76,50,25,75,
'레드향은 프리미엄 만감류로 선물수요와 당도가 핵심입니다.',
'일반 감귤 가격표보다 프리미엄 시장으로 봐야 합니다.',
'선물세트 | 고당도선별 | 온라인직거래',now())
on conflict do nothing;

insert into crop_price_evidence
(crop_name, evidence_type, source_name, source_grade, signal_direction, weight_percent, confidence_percent, value_text, summary)
values
('홍산마늘','품종가치','농진청/K-AGRI 스토리','A','up',20,88,'국산 품종 보호작물','홍산마늘은 K-AGRI 대표 보호작물로 별도 스토리 가치가 반영됩니다.'),
('홍산마늘','시장가격','KAMIS/가락시장','A','up',15,90,'가격 상승 신호','공식 가격 데이터 기준 상승 신호가 있습니다.'),
('홍산마늘','현장데이터','K-AGRI 현장데이터','C','up',18,76,'현장 제보 반영','농민 현장 데이터가 쌓일수록 정확도가 올라갑니다.'),
('홍산마늘','해외위험','중국 농산물 동향','B','neutral',12,65,'수입압박 감시','중국산 마늘과 종구 흐름을 지속 감시해야 합니다.'),
('홍산마늘','소비스토리','한국농수산TV','B','up',15,80,'콘텐츠 가치','홍산마늘은 가격보다 브랜드·콘텐츠 가치가 높은 품목입니다.'),

('양파','수입위험','중국 농산물 동향','B','down',25,78,'중국산 압박','중국산 양파 유입과 규격 균일성 이슈가 위험요인입니다.'),
('양파','정부정책','농림축산식품부','A','down',20,86,'정부개입 가능성','생활물가 민감 품목으로 정부개입 가능성이 높습니다.'),
('양파','시장가격','KAMIS/가락시장','A','down',20,90,'공식가격 약세','공식 가격 기준 약세 신호가 있습니다.'),

('오이','출하집중','K-AGRI 현장데이터','C','down',25,75,'홍천 출하 집중','홍천권 출하 집중 시 가격 급락 가능성이 큽니다.'),
('오이','반입량','가락시장','A','down',20,88,'반입량 증가','반입량 증가는 단기 가격 하락 압력입니다.'),
('오이','기후','기상청','A','down',15,80,'생산량 증가 가능','기상 조건에 따라 출하량 증가 가능성이 있습니다.')
on conflict do nothing;

update crop_market_signals cms
set
  evidence_count = sub.cnt,
  data_confidence_percent = sub.confidence,
  public_data_percent = sub.public_pct,
  field_data_percent = sub.field_pct,
  global_data_percent = sub.global_pct,
  last_evidence_checked_at = now()
from (
  select
    crop_name,
    count(*)::int as cnt,
    round(avg(confidence_percent))::int as confidence,
    round(avg(case when source_grade = 'A' then confidence_percent else null end))::int as public_pct,
    round(avg(case when source_name like '%현장%' or source_name like '%거래소%' then confidence_percent else null end))::int as field_pct,
    round(avg(case when source_name like '%중국%' or source_name like '%USDA%' then confidence_percent else null end))::int as global_pct
  from crop_price_evidence
  group by crop_name
) sub
where cms.crop_name = sub.crop_name;
