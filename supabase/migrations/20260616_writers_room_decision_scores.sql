alter table public.writers_room_recommendations
add column if not exists farmer_score integer default 0;

alter table public.writers_room_recommendations
add column if not exists money_score integer default 0;

alter table public.writers_room_recommendations
add column if not exists view_score integer default 0;

alter table public.writers_room_recommendations
add column if not exists commerce_score integer default 0;

alter table public.writers_room_recommendations
add column if not exists urgency_score integer default 0;

alter table public.writers_room_recommendations
add column if not exists grade text default 'C';

alter table public.writers_room_recommendations
add column if not exists source_page_number integer;
