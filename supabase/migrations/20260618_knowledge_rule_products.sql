create table if not exists public.knowledge_rule_products (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.knowledge_rules(id) on delete cascade,
  product_name text not null,
  product_type text,
  purpose text,
  caution text,
  source_reference text,
  status text default 'candidate',
  created_at timestamptz default now()
);

create index if not exists knowledge_rule_products_rule_idx
on public.knowledge_rule_products(rule_id);

create index if not exists knowledge_rule_products_name_idx
on public.knowledge_rule_products(product_name);
