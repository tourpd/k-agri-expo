create table if not exists farmer_decision_responses (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  region text,
  inventory_status text,
  sell_plan text,
  price_outlook text,
  note text,
  sentiment_score integer,
  created_at timestamptz default now()
);
