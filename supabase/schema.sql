-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null,
  couple_code text not null unique,
  couple_id   uuid references couples (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists couples (
  id         uuid primary key default gen_random_uuid(),
  user_a_id  uuid not null references users (id) on delete cascade,
  user_b_id  uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint couples_unique_pair unique (user_a_id, user_b_id),
  constraint couples_different_users check (user_a_id <> user_b_id)
);

create table if not exists recipes (
  id          uuid primary key default gen_random_uuid(),
  week_id     text not null,
  title       text not null,
  description text not null default '',
  ingredients jsonb not null default '[]',
  steps       jsonb not null default '[]',
  tags        text[] not null default '{}',
  image_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists swipes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  couple_id  uuid not null references couples (id) on delete cascade,
  recipe_id  uuid not null references recipes (id) on delete cascade,
  week_id    text not null,
  direction  text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  constraint swipes_unique_user_recipe unique (user_id, recipe_id, week_id)
);

create table if not exists matches (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples (id) on delete cascade,
  recipe_id  uuid not null references recipes (id) on delete cascade,
  week_id    text not null,
  created_at timestamptz not null default now(),
  constraint matches_unique_couple_recipe unique (couple_id, recipe_id, week_id)
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

create index if not exists swipes_couple_recipe_week_idx
  on swipes (couple_id, recipe_id, week_id, direction);

create index if not exists matches_couple_week_idx
  on matches (couple_id, week_id);

-- ─────────────────────────────────────────────
-- Match-detection trigger
--
-- After a swipe is inserted with direction = 'right', check whether
-- the partner in the same couple has already swiped right on the same
-- recipe in the same week. If so, insert a row into matches.
-- ─────────────────────────────────────────────

create or replace function check_and_create_match()
returns trigger
language plpgsql
security definer
as $$
declare
  v_partner_id uuid;
  v_partner_swiped boolean;
begin
  -- Only act on right swipes
  if new.direction <> 'right' then
    return new;
  end if;

  -- Find the partner in this couple
  select
    case
      when c.user_a_id = new.user_id then c.user_b_id
      else c.user_a_id
    end
  into v_partner_id
  from couples c
  where c.id = new.couple_id;

  if v_partner_id is null then
    return new;
  end if;

  -- Check whether the partner has already swiped right on this recipe/week
  select exists (
    select 1
    from swipes s
    where s.user_id   = v_partner_id
      and s.couple_id = new.couple_id
      and s.recipe_id = new.recipe_id
      and s.week_id   = new.week_id
      and s.direction = 'right'
  ) into v_partner_swiped;

  if v_partner_swiped then
    insert into matches (couple_id, recipe_id, week_id)
    values (new.couple_id, new.recipe_id, new.week_id)
    on conflict (couple_id, recipe_id, week_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_swipe_inserted on swipes;

create trigger on_swipe_inserted
  after insert on swipes
  for each row
  execute function check_and_create_match();

-- ─────────────────────────────────────────────
-- Row-Level Security (RLS)
-- ─────────────────────────────────────────────

alter table users   enable row level security;
alter table couples enable row level security;
alter table recipes enable row level security;
alter table swipes  enable row level security;
alter table matches enable row level security;

-- Users: read own row, insert own row
create policy "users_select_own" on users
  for select using (auth.uid() = id);

create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on users
  for update using (auth.uid() = id);

-- Couples: members can read their couple
create policy "couples_select_members" on couples
  for select using (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

create policy "couples_insert_members" on couples
  for insert with check (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

-- Recipes: all authenticated users can read recipes
create policy "recipes_select_authenticated" on recipes
  for select using (auth.role() = 'authenticated');

-- Swipes: users can read/write their own swipes
create policy "swipes_select_own" on swipes
  for select using (auth.uid() = user_id);

create policy "swipes_insert_own" on swipes
  for insert with check (auth.uid() = user_id);

-- Matches: couple members can read their matches
create policy "matches_select_couple" on matches
  for select using (
    exists (
      select 1 from couples c
      where c.id = matches.couple_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );
