create table if not exists customers (
  id uuid primary key default gen_random_uuid(),

  phone text not null unique,
  name text,

  roles text[] default '{}',

  region text,
  address text,

  crop text,
  farm_size text,

  profile_stage text default '신규',

  is_member boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customers_phone
on customers(phone);

create table if not exists customer_roles (
  id uuid primary key default gen_random_uuid(),

  phone text not null,

  role text not null,

  created_at timestamptz default now()
);

create index if not exists idx_customer_roles_phone
on customer_roles(phone);

create index if not exists idx_customer_roles_role
on customer_roles(role);

insert into customers (
  phone,
  name,
  crop,
  farm_size,
  is_member,
  roles
)
select
  phone,
  name,
  crop,
  farm_size,
  true,
  ARRAY['Farmer']
from farmers
where phone is not null
on conflict (phone)
do nothing;

