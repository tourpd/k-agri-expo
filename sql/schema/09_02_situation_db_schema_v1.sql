CREATE TABLE IF NOT EXISTS situation_db (
    id BIGSERIAL PRIMARY KEY,
    situation_id TEXT UNIQUE NOT NULL,

    source_type TEXT NOT NULL,
    source_name TEXT,
    source_id TEXT,
    source_url TEXT,
    title TEXT,

    crop TEXT,
    region TEXT,
    season TEXT,
    growth_stage TEXT,
    weather_context TEXT,

    problem TEXT,
    problem_type TEXT,
    cause TEXT,
    solution TEXT,
    result TEXT,
    emotion TEXT,

    farmer_quote TEXT,
    expert_quote TEXT,

    product TEXT,
    company TEXT,
    material_type TEXT,
    cost_info TEXT,
    roi_hint TEXT,

    content_angle TEXT,
    chulsoo_point TEXT,
    business_point TEXT,

    confidence_score NUMERIC(4,3) DEFAULT 0.000,
    status TEXT DEFAULT 'raw',

    raw_text TEXT,
    extracted_json JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_situation_crop ON situation_db(crop);
CREATE INDEX IF NOT EXISTS idx_situation_region ON situation_db(region);
CREATE INDEX IF NOT EXISTS idx_situation_problem ON situation_db(problem);
CREATE INDEX IF NOT EXISTS idx_situation_problem_type ON situation_db(problem_type);
CREATE INDEX IF NOT EXISTS idx_situation_emotion ON situation_db(emotion);
CREATE INDEX IF NOT EXISTS idx_situation_product ON situation_db(product);
CREATE INDEX IF NOT EXISTS idx_situation_company ON situation_db(company);
CREATE INDEX IF NOT EXISTS idx_situation_source_type ON situation_db(source_type);
CREATE INDEX IF NOT EXISTS idx_situation_status ON situation_db(status);
CREATE INDEX IF NOT EXISTS idx_situation_created_at ON situation_db(created_at);

COMMENT ON TABLE situation_db IS 'K-AGRI 핵심 상황 DB. 모든 자료를 농민 상황 단위로 저장한다.';
COMMENT ON COLUMN situation_db.situation_id IS 'SIT-000001 형태의 상황 고유 ID';
COMMENT ON COLUMN situation_db.source_type IS 'KOAF_TV, ANIYOUNG, RDA, KOREA_AGRO, PHOTO_DOCTOR, CRM 등';
COMMENT ON COLUMN situation_db.crop IS '작물';
COMMENT ON COLUMN situation_db.problem IS '농민이 겪는 문제';
COMMENT ON COLUMN situation_db.cause IS '문제의 원인';
COMMENT ON COLUMN situation_db.solution IS '해결방법';
COMMENT ON COLUMN situation_db.result IS '결과';
COMMENT ON COLUMN situation_db.emotion IS '농민 감정';
COMMENT ON COLUMN situation_db.chulsoo_point IS '철수 콘텐츠 전환 포인트';
COMMENT ON COLUMN situation_db.business_point IS '사업/협찬/PPL 연결 포인트';
