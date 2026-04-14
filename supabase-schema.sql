-- ─────────────────────────────────────────────────
-- FitPulse Supabase Schema
-- Run this entire file in the Supabase SQL editor.
-- ─────────────────────────────────────────────────

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  role       text not null check (role in ('trainer','client')),
  trainer_id uuid references profiles(id),
  age        integer,
  goal       text,
  emoji      text,
  status     text not null default 'active' check (status in ('active','pending','rejected'))
);

-- 2. PROGRAMS
create table if not exists programs (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid references profiles(id) on delete cascade not null,
  name        text not null,
  description text,
  exercises   jsonb not null default '[]'
);

-- 3. ASSIGNMENTS (client → program, one active program per client)
create table if not exists assignments (
  client_id  uuid references profiles(id) on delete cascade,
  program_id uuid references programs(id) on delete cascade,
  primary key (client_id, program_id)
);

-- 4. SESSIONS
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references profiles(id) on delete cascade not null,
  program_id uuid references programs(id),
  date       timestamptz not null default now(),
  logs       jsonb not null default '[]'
);

-- 5. NUTRITION PLANS (one per client, upserted)
create table if not exists nutrition (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade unique not null,
  name      text,
  cal       integer default 0,
  protein   integer default 0,
  carbs     integer default 0,
  fat       integer default 0
);

-- 6. MEAL LOGS (one row per client per day, items stored as JSON array)
create table if not exists meals (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade not null,
  date      date not null,
  items     jsonb not null default '[]',
  unique (client_id, date)
);

-- 7. TRAINER NOTES
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references profiles(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz default now()
);

-- 8. CLIENT FEEDBACK
create table if not exists feedback (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references profiles(id) on delete cascade not null,
  text       text not null,
  rating     integer check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- 9. MONTHLY INCOME
create table if not exists income (
  id         uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade not null,
  month      text not null,   -- format: 'YYYY-MM'
  amount     numeric default 0,
  unique (trainer_id, month)
);


-- ─────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────

alter table profiles   enable row level security;
alter table programs   enable row level security;
alter table assignments enable row level security;
alter table sessions   enable row level security;
alter table nutrition  enable row level security;
alter table meals      enable row level security;
alter table notes      enable row level security;
alter table feedback   enable row level security;
alter table income     enable row level security;

-- profiles: users can read any profile (needed to find trainer by email at signup)
create policy "profiles_select" on profiles for select using (true);
-- users can insert their own profile
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
-- trainers can update their clients; users can update themselves
create policy "profiles_update" on profiles for update using (
  auth.uid() = id or
  auth.uid() = trainer_id
);

-- programs: trainers manage their own; clients can read programs assigned to them
create policy "programs_select" on programs for select using (
  auth.uid() = trainer_id or
  exists (select 1 from assignments where assignments.program_id = programs.id and assignments.client_id = auth.uid())
);
create policy "programs_insert" on programs for insert with check (auth.uid() = trainer_id);
create policy "programs_update" on programs for update using (auth.uid() = trainer_id);
create policy "programs_delete" on programs for delete using (auth.uid() = trainer_id);

-- assignments: trainers manage; clients can read their own
create policy "assignments_select" on assignments for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = assignments.client_id and profiles.trainer_id = auth.uid())
);
create policy "assignments_insert" on assignments for insert with check (
  exists (select 1 from profiles where profiles.id = assignments.client_id and profiles.trainer_id = auth.uid())
);
create policy "assignments_delete" on assignments for delete using (
  exists (select 1 from profiles where profiles.id = assignments.client_id and profiles.trainer_id = auth.uid())
);

-- sessions: trainer or the client themselves
create policy "sessions_select" on sessions for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = sessions.client_id and profiles.trainer_id = auth.uid())
);
create policy "sessions_insert" on sessions for insert with check (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = sessions.client_id and profiles.trainer_id = auth.uid())
);
create policy "sessions_delete" on sessions for delete using (
  exists (select 1 from profiles where profiles.id = sessions.client_id and profiles.trainer_id = auth.uid())
);

-- nutrition: trainer sets it; client can read their own
create policy "nutrition_select" on nutrition for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = nutrition.client_id and profiles.trainer_id = auth.uid())
);
create policy "nutrition_insert" on nutrition for insert with check (
  exists (select 1 from profiles where profiles.id = nutrition.client_id and profiles.trainer_id = auth.uid())
);
create policy "nutrition_update" on nutrition for update using (
  exists (select 1 from profiles where profiles.id = nutrition.client_id and profiles.trainer_id = auth.uid())
);

-- meals: trainer or client can log/read
create policy "meals_select" on meals for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = meals.client_id and profiles.trainer_id = auth.uid())
);
create policy "meals_insert" on meals for insert with check (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = meals.client_id and profiles.trainer_id = auth.uid())
);
create policy "meals_update" on meals for update using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = meals.client_id and profiles.trainer_id = auth.uid())
);

-- notes: trainer only
create policy "notes_select" on notes for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = notes.client_id and profiles.trainer_id = auth.uid())
);
create policy "notes_insert" on notes for insert with check (
  exists (select 1 from profiles where profiles.id = notes.client_id and profiles.trainer_id = auth.uid())
);
create policy "notes_delete" on notes for delete using (
  exists (select 1 from profiles where profiles.id = notes.client_id and profiles.trainer_id = auth.uid())
);

-- feedback: client submits; trainer reads
create policy "feedback_insert" on feedback for insert with check (auth.uid() = client_id);
create policy "feedback_select" on feedback for select using (
  auth.uid() = client_id or
  exists (select 1 from profiles where profiles.id = feedback.client_id and profiles.trainer_id = auth.uid())
);

-- income: trainer only
create policy "income_select" on income for select using (auth.uid() = trainer_id);
create policy "income_insert" on income for insert with check (auth.uid() = trainer_id);
create policy "income_update" on income for update using (auth.uid() = trainer_id);
