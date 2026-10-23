-- HSK Master: one row of learning progress per user.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- One user's progress is well under 2 MB even with every word studied; the cap stops anyone using the table as free storage.
alter table public.progress drop constraint if exists progress_size;
alter table public.progress add constraint progress_size check (octet_length(data::text) < 4000000);

-- Each user can read and write only their own row.
create policy "own progress: select" on public.progress for select using (auth.uid() = user_id);
create policy "own progress: insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "own progress: update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress: delete" on public.progress for delete using (auth.uid() = user_id);

-- "Ask Claude" chat: how many questions each user asked per day, so one account can't run up the API bill.
-- Only the ask function (service role) writes here; users can't read or change it.
create table if not exists public.ask_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.ask_usage enable row level security;

create or replace function public.ask_bump(uid uuid, cap int) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into ask_usage (user_id, day, count) values (uid, current_date, 1)
  on conflict (user_id, day) do update set count = ask_usage.count + 1
  returning count into n;
  return n <= cap;
end $$;

revoke all on function public.ask_bump(uuid, int) from public, anon, authenticated;
