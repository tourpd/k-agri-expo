alter table knowledge_action_instructions
add column if not exists risk_level text default 'medium';

alter table knowledge_action_instructions
add column if not exists priority integer default 3;

alter table knowledge_action_instructions
add column if not exists deadline_hours integer default 72;

alter table knowledge_action_instructions
add column if not exists step1 text;

alter table knowledge_action_instructions
add column if not exists step2 text;

alter table knowledge_action_instructions
add column if not exists step3 text;

alter table knowledge_action_instructions
add column if not exists expected_loss text;

alter table knowledge_action_instructions
add column if not exists recommended_product text;

alter table knowledge_action_instructions
add column if not exists economic_impact text;

alter table knowledge_action_instructions
add column if not exists notification_message text;

update knowledge_action_instructions
set
risk_level='medium',
priority=3,
deadline_hours=72
where risk_level is null;
