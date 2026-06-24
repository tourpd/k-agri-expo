create table if not exists farm_calendar_actions (
  id uuid primary key default gen_random_uuid(),

  source_page_id uuid,
  source_type text,

  crop text,
  month_no int,
  growth_stage text,

  problem_title text,
  action_instruction text,

  recommended_materials text[],
  shorts_title text,
  sms_message text,

  importance_score int default 0,

  created_at timestamptz default now()
);

create index if not exists idx_farm_calendar_crop
on farm_calendar_actions(crop);

create index if not exists idx_farm_calendar_month
on farm_calendar_actions(month_no);

create index if not exists idx_farm_calendar_crop_month
on farm_calendar_actions(crop, month_no);
