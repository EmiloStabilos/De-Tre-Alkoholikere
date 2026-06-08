-- De Tre Alkoholikere — schema
-- Tasting app: rate alcohol by category (Beer, Wine, Vermouth, ...)

create extension if not exists "pgcrypto";

-- Alcohol categories drive the home-page navigation.
-- attribute_schema describes the category-specific fields used by the
-- "add product" form (rendered dynamically on the frontend).
create table if not exists categories (
  id               text primary key,            -- slug, e.g. 'beer'
  name             text not null,
  emoji            text,
  sort_order       int  not null default 0,
  is_active        boolean not null default true,
  attribute_schema jsonb not null default '[]'::jsonb
);

-- The people doing the tasting.
create table if not exists tasters (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_guest   boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- A tasting evening ("Aften").
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  category_id text references categories(id) on delete set null,
  name        text not null,
  date        date,
  host        text,
  location    text,
  created_at  timestamptz not null default now()
);

-- A specific drink that was tasted.
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  category_id text not null references categories(id) on delete cascade,
  name        text not null,
  producer    text,
  abv         numeric,                          -- percent, e.g. 5.6
  attributes  jsonb not null default '{}'::jsonb,
  photo_url   text,
  created_at  timestamptz not null default now()
);
create index if not exists products_category_idx on products(category_id);

-- One score per taster per product.
create table if not exists ratings (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  taster_id    uuid not null references tasters(id) on delete cascade,
  session_id   uuid references sessions(id) on delete set null,
  score        numeric not null check (score >= 0 and score <= 5),
  extra_points numeric,
  taste_note   text,
  aroma_note   text,
  color_note   text,
  created_at   timestamptz not null default now(),
  unique (product_id, taster_id)
);
create index if not exists ratings_product_idx on ratings(product_id);
create index if not exists ratings_session_idx on ratings(session_id);

-- Auto-computed averages ("GNS").
create or replace view product_averages with (security_invoker = on) as
select
  p.id          as product_id,
  p.category_id,
  p.name,
  p.producer,
  count(r.id)                                  as num_ratings,
  round(avg(r.score)::numeric, 2)              as avg_score,
  round(avg(coalesce(r.extra_points,0))::numeric, 2) as avg_extra,
  round(avg(r.score + coalesce(r.extra_points,0))::numeric, 2) as avg_total
from products p
left join ratings r on r.product_id = p.id
group by p.id;

-- ---------------------------------------------------------------------------
-- Row Level Security: everyone shares one authenticated account (password
-- gate), so "authenticated" = inside the app. Anonymous access is denied.
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table tasters    enable row level security;
alter table sessions   enable row level security;
alter table products   enable row level security;
alter table ratings    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','tasters','sessions','products','ratings']
  loop
    execute format('drop policy if exists %I on %I', t||'_read',  t);
    execute format('drop policy if exists %I on %I', t||'_write', t);
    execute format('create policy %I on %I for select to authenticated using (true)', t||'_read', t);
    execute format('create policy %I on %I for all to authenticated using (true) with check (true)', t||'_write', t);
  end loop;
end $$;
