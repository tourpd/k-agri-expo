alter table knowledge_page_index
add column if not exists visual_summary text;

alter table knowledge_page_index
add column if not exists visual_findings jsonb default '{}'::jsonb;

alter table knowledge_page_index
add column if not exists auto_analyzed_at timestamptz;

alter table knowledge_page_index
add column if not exists image_analysis_status text default 'pending';
