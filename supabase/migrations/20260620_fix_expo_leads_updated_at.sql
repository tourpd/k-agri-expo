alter table public.expo_leads
add column if not exists updated_at timestamptz default now();

create or replace function public.set_expo_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_expo_leads_updated_at on public.expo_leads;

create trigger trg_set_expo_leads_updated_at
before update on public.expo_leads
for each row
execute function public.set_expo_leads_updated_at();
