create table if not exists agri_data_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_category text not null,
  source_grade text default 'B',
  source_url text,
  update_cycle text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agri_ai_market_data (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  region_name text default '전국',
  data_category text not null,
  source_name text not null,
  source_grade text default 'B',
  title text,
  value_text text,
  signal_direction text default 'neutral',
  risk_percent integer default 0,
  opportunity_percent integer default 0,
  confidence_percent integer default 0,
  summary text,
  source_url text,
  collected_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists agri_processing_opportunities (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  opportunity_type text not null,
  product_idea text not null,
  target_partner text,
  raw_material_reason text,
  market_reason text,
  farmer_benefit text,
  business_score integer default 0,
  urgency_score integer default 0,
  status text default '검토중',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists agri_kffr_opportunities (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  functional_keyword text,
  product_concept text,
  kffr_reason text,
  hanmi_reason text,
  farmer_rescue_reason text,
  raw_material_form text,
  priority_score integer default 0,
  evidence_summary text,
  next_action text,
  status text default '후보',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into agri_data_sources
(source_name, source_category, source_grade, source_url, update_cycle, description)
values
('KAMIS','국내가격','A','https://www.kamis.or.kr','일별','aT 농산물 도매·소매 가격'),
('가락시장','국내가격','A','https://www.garak.co.kr','일별/시간대별','경락가·반입량'),
('농넷','국내가격','A','https://www.nongnet.or.kr','일별','농산물 유통 종합정보'),
('농림축산식품부','정부정책','A','https://www.mafra.go.kr','수시','수급대책·TRQ·비축·수입정책'),
('농사로','재배기술','A','https://www.nongsaro.go.kr','수시','농진청 재배·병해충·작황정보'),
('기상청','기후','A','https://www.weather.go.kr','시간대별','폭염·태풍·가뭄·한파'),
('중국 농산물 동향','해외','B',null,'매일','중국 생산·수입·작황·가격 뉴스'),
('USDA/FAO','해외','A',null,'주간/월간','국제 농산물 수급·식량시장'),
('소비시장','소비','B',null,'매일','대형마트·급식·외식·온라인 수요'),
('K-AGRI 현장데이터','현장','C',null,'실시간','농민 실거래·저장물량·출하 제보'),
('K-AGRI 거래소','거래','B',null,'실시간','바이어 관심·거래제안·등록물량')
on conflict do nothing;

insert into agri_ai_market_data
(crop_name, region_name, data_category, source_name, source_grade, title, value_text, signal_direction, risk_percent, opportunity_percent, confidence_percent, summary)
values
('홍산마늘','전국','품종가치','농사로','A','홍산마늘 국산 품종 가치','국산 품종 보호작물','up',20,95,85,'홍산마늘은 단순 마늘 가격이 아니라 국산 품종 독립과 브랜드화 가치가 큽니다.'),
('홍산마늘','전국','해외위험','중국 농산물 동향','B','중국산 마늘·종구 압박','지속 감시 필요','neutral',55,65,60,'중국산 마늘과 종구 흐름은 국내 마늘 가격과 품종 생태계에 영향을 줄 수 있습니다.'),
('홍산마늘','전국','KFFR기회','K-AGRI 현장데이터','C','흑마늘·발효마늘 원료화','높음','up',15,92,70,'가격방어와 건강식품 원료화가 동시에 가능한 후보입니다.'),
('양파','전국','수입위험','중국 농산물 동향','B','중국산 양파 압박','높음','down',85,70,70,'중국산 양파 유입과 규격 균일성은 국산 양파 가격방어에 큰 변수입니다.'),
('양파','전국','정부정책','농림축산식품부','A','정부 수급개입 가능성','높음','down',80,50,85,'생활물가 민감 품목으로 가격 상승 시 정부개입 가능성이 있습니다.'),
('양파','전국','KFFR기회','K-AGRI 현장데이터','C','퀘르세틴 양파 원료화','가능','neutral',45,82,65,'가격폭락 시 양파즙·분말·퀘르세틴 콘셉트 원료화 검토가 가능합니다.'),
('오이','강원 홍천','가격붕괴','K-AGRI 현장데이터','C','홍천 오이 출하집중 위험','매우 높음','down',90,60,75,'저장성이 낮아 출하 집중 시 가격 급락 위험이 큽니다.'),
('오이','강원 홍천','KFFR기회','소비시장','B','오이 이너뷰티·수분 콘셉트','검토','neutral',55,72,60,'폭락 오이는 분말·주스·이너뷰티 원료 후보가 될 수 있습니다.'),
('감귤','제주','KFFR기회','소비시장','B','감귤 플라보노이드·비타민 원료','높음','up',35,86,70,'감귤·레드향 과잉 시 껍질·과육 부산물을 활용한 이너뷰티 원료화 가능성이 있습니다.'),
('브로콜리','전국','KFFR기회','소비시장','B','설포라판 콘셉트','높음','up',30,88,68,'브로콜리는 건강식품 원료 스토리가 명확한 작물입니다.')
on conflict do nothing;

insert into agri_processing_opportunities
(crop_name, opportunity_type, product_idea, target_partner, raw_material_reason, market_reason, farmer_benefit, business_score, urgency_score, status)
values
('홍산마늘','발효/흑마늘','홍산 흑마늘 진액·환·스틱','한미양행/KFFR','국산 품종 스토리와 기능성 마늘 이미지가 강함','면역·활력·혈행 콘셉트로 확장 가능','가격방어와 브랜드 프리미엄 가능',95,90,'우선검토'),
('양파','즙/분말','퀘르세틴 양파즙·양파분말','한미양행/KFFR','가격폭락 시 대량 원료 확보 가능','혈행·항산화 콘셉트와 연결 가능','폭락 물량 수매로 농가 구제 가능',88,85,'후보'),
('오이','음료/분말','오이 수분 이너뷰티 음료·분말','KFFR','저장불가 폭락 작물의 가공전환 필요','저칼로리·수분·피부 콘셉트 가능','출하집중 물량을 가공으로 흡수',78,92,'후보'),
('감귤','분말/이너뷰티','감귤 플라보노이드 분말·젤리','한미양행/KFFR','과잉·비상품과 활용 가능','비타민C·항산화·이너뷰티 시장과 연결','비상품과 부가가치화 가능',86,70,'후보'),
('브로콜리','분말/환','브로콜리 설포라판 분말·환','한미양행/KFFR','건강 원료 스토리가 명확함','항산화·건강식 시장 진입 가능','과잉 물량의 고부가 전환 가능',84,72,'후보')
on conflict do nothing;

insert into agri_kffr_opportunities
(crop_name, functional_keyword, product_concept, kffr_reason, hanmi_reason, farmer_rescue_reason, raw_material_form, priority_score, evidence_summary, next_action, status)
values
('홍산마늘','마늘·발효·활력','홍산마늘 흑마늘 스틱/환','국산 품종 독립과 미래식량 자원화 스토리가 강함','건강식품 제조·브랜드화 가능성이 높음','홍산마늘 농가의 가격방어와 품종 보존을 동시에 달성','흑마늘, 발효농축액, 분말',98,'국산 품종 가치, 마늘 기능성 이미지, K-AGRI 스토리 자산 보유','한미양행/KFFR 1차 원료검토 회의 제안','최우선'),
('양파','퀘르세틴·항산화','양파 퀘르세틴 분말/즙','폭락 반복 품목을 원료화해 농가 구제 가능','분말·즙·복합소재 제품화 가능','수입압박과 가격폭락 시 수매 안전판 역할','양파즙, 양파분말, 농축액',88,'수입위험·정부개입 위험이 큰 품목으로 가격방어 장치 필요','가격폭락 구간 원료 매입 시뮬레이션','후보'),
('오이','수분·이너뷰티','오이 수분 이너뷰티 음료/파우더','저장불가 폭락 작물을 가공소재로 전환','이너뷰티·저칼로리 제품 기획 가능','홍천 오이 같은 가격폭락 피해를 줄일 수 있음','착즙, 동결건조분말',82,'출하집중 시 가격 급락 위험이 큰 대표 작물','홍천 오이 가공 테스트 검토','후보'),
('감귤','비타민C·플라보노이드','감귤 이너뷰티 젤리/분말','제주 과잉·비상품과 활용 가능','한미양행 건강식품 라인과 연결 쉬움','비상품과 부가가치화 가능','과육분말, 껍질추출물',86,'감귤·만감류는 기능성 스토리와 소비자 이해도가 높음','제주 감귤 원료 공급처 조사','후보'),
('브로콜리','설포라판','브로콜리 설포라판 환/분말','미래 건강식 원료로 스토리 명확','건기식 소재화 가능성 있음','과잉 생산 시 가공수요 창출 가능','동결건조분말',84,'설포라판 콘셉트는 소비자 인지도가 높음','원료 표준화 가능성 검토','후보')
on conflict do nothing;
