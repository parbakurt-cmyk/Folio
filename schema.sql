-- Run this in Supabase: SQL Editor -> New query -> Run
create table public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text,
  phone       text,
  address     text,
  about       text,
  education   text,
  skills      text,
  projects    text,
  experience  text,
  links       text,
  photo       text,
  template    smallint not null default 1 check (template between 1 and 3),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.portfolios enable row level security;

create policy "read own portfolio"   on public.portfolios for select using (auth.uid() = user_id);
create policy "create own portfolio" on public.portfolios for insert with check (auth.uid() = user_id);
create policy "edit own portfolio"   on public.portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own portfolio" on public.portfolios for delete using (auth.uid() = user_id);