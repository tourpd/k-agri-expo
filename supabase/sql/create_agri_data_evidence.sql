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
  source_url text,
  signal_direction text default 'neutral',
  weight_percent numeric default 0,
  confidence_percent numeric default 0,
  value_text text,
  summary text,
  checked_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table crop_market_signals
add column if not exists evidence_count integer default 0,
add column if not exists data_confidence_percent integer default 0,
add column if not exists public_data_percent integer default 0,
add column if not exists field_data_percent integer default 0,
add column if not exists global_data_percent integer default 0,
add column if not exists last_evidence_checked_at timestamptz;

insert into agri_data_sources
(source_name, source_type, source_grade, source_url, description)
values
('KAMIS', '국내가격', 'A', 'https://www.kamis.or.kr', 'aT 농산물유통정보 도매·소매 가격'),
('가락시장', '국내가격', 'A', 'https://www.garak.co.kr', '서울시농수산식품공사 경락가·반입량'),
('농넷', '국내가격', 'A', 'https://www.nongnet.or.kr', '농산물 유통 종합정보'),
('농림축산식품부', '정책', 'A', 'https://www.mafra.go.kr', '수급대책·TRQ·수입·비축물량 정책'),
('농사로', '재배기술', 'A', 'https://www.nongsaro.go.kr', '농촌진흥청 병해충·작황·재배기술'),
('기상청', '기후', 'A', 'https://www.weather.go.kr', '기상·폭염·한파·태풍·가뭄'),
('중국 농산물 뉴스', '해외', 'B', null, '중국 생산량·수입·작황·정책 뉴스'),
('USDA', '해외', 'A', 'https://www.usda.gov', '미국 농산물 수급·세계 농업 전망'),
('K-AGRI 현장제보', '현장', 'C', null, '농민 실거래 가격·저장물량·출하상황'),
('K-AGRI 거래소', '거래', 'B', null, 'K-AGRI 등록 농산물·거래제안·바이어 관심')
on conflict do nothing;

insert into crop_price_evidence
(crop_name, region_name, evidence_type, source_name, source_grade, source_url, signal_direction, weight_percent, confidence_percent, value_text, summary)
values
('홍산마늘','전국','도매가격','KAMIS','A','https://www.kamis.or.kr','up',15,90,'최근 도매가격 상승 신호','공식 도매가격 기준 상승 흐름이 확인됩니다.'),
('홍산마늘','전국','경락가','가락시장','A','https://www.garak.co.kr','up',15,88,'경락가 강세','가락시장 기준 가격 상승 신호가 있습니다.'),
('홍산마늘','전국','반입량','가락시장','A','https://www.garak.co.kr','up',12,85,'반입량 감소','반입량 감소는 가격 강세 요인입니다.'),
('홍산마늘','전국','수입동향','중국 농산물 뉴스','B',null,'up',10,65,'중국산 압박 낮음','중국산 수입 압박은 현재 낮은 편으로 반영합니다.'),
('홍산마늘','전국','정부정책','농림축산식품부','A','https://www.mafra.go.kr','neutral',10,80,'정부개입 보통','가격 상승 시 정부 수급대책 가능성은 계속 확인이 필요합니다.'),
('홍산마늘','전국','현장제보','K-AGRI 현장제보','C',null,'up',18,70,'농민 제보 7건','저장마늘 현장가격 상승 제보가 반영되었습니다.'),
('홍산마늘','전국','거래소','K-AGRI 거래소','B',null,'up',20,75,'바이어 관심 있음','대형 바이어 연결 가능성이 반영되었습니다.'),

('양파','전국','도매가격','KAMIS','A','https://www.kamis.or.kr','down',12,90,'도매가격 약세','공식 가격 기준 약세 신호가 있습니다.'),
('양파','전국','경락가','가락시장','A','https://www.garak.co.kr','down',12,88,'경락가 하락','가락시장 기준 가격 하락 신호가 있습니다.'),
('양파','전국','수입동향','중국 농산물 뉴스','B',null,'down',25,70,'중국산 압박 높음','중국산 양파 유입 및 규격 균일성 이슈를 위험요인으로 반영합니다.'),
('양파','전국','정부정책','농림축산식품부','A','https://www.mafra.go.kr','down',20,85,'정부개입 가능성 높음','물가 민감 품목으로 수급대책 가능성이 높게 반영됩니다.'),
('양파','전국','저장물량','K-AGRI 현장제보','C',null,'down',16,62,'저장물량 부담','산지 저장물량 부담 신호가 있습니다.'),
('양파','전국','기후','기상청','A','https://www.weather.go.kr','neutral',5,80,'기상영향 보통','현재 기상요인은 중립으로 반영합니다.'),
('양파','전국','거래소','K-AGRI 거래소','B',null,'neutral',10,65,'바이어 관망','바이어 매수세는 관망으로 반영합니다.'),

('오이','강원 홍천','현장제보','K-AGRI 현장제보','C',null,'down',25,75,'출하 집중 제보','홍천권 출하 집중 위험 신호가 있습니다.'),
('오이','강원 홍천','경락가','가락시장','A','https://www.garak.co.kr','down',20,88,'가격 급락','최근 가격 하락 신호가 강합니다.'),
('오이','강원 홍천','반입량','가락시장','A','https://www.garak.co.kr','down',20,86,'반입량 증가','반입량 증가로 가격 압박이 큽니다.'),
('오이','강원 홍천','기후','기상청','A','https://www.weather.go.kr','down',15,80,'생산량 증가 가능','기온 영향으로 출하량 증가 가능성을 반영합니다.'),
('오이','강원 홍천','저장성','농사로','A','https://www.nongsaro.go.kr','down',10,85,'저장 어려움','저장성이 낮아 출하 집중 시 가격 급락 위험이 큽니다.'),
('오이','강원 홍천','수입동향','중국 농산물 뉴스','B',null,'neutral',5,50,'수입 영향 낮음','현재 수입 영향은 낮게 반영합니다.'),
('오이','강원 홍천','거래소','K-AGRI 거래소','B',null,'neutral',5,60,'직거래 필요','직거래 확보 필요성이 반영됩니다.')
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

select * from crop_price_evidence order by crop_name, weight_percent desc;
