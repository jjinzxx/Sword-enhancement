-- ============================================================
-- 관리자 명령어 RPC 패치
-- Supabase SQL Editor에 이 파일 전체를 붙여넣고 Run 하세요.
-- ============================================================

grant usage on schema public to anon, authenticated;

create table if not exists public.sword_chat (
  id bigint generated always as identity primary key,
  nickname text not null,
  message text,
  item_level int,
  item_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.sword_players (
  client_id uuid primary key,
  nickname text not null,
  gold bigint not null default 0,
  daily_gold bigint not null default 0,
  daily_gold_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.sword_admin_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.sword_chat enable row level security;
alter table public.sword_players enable row level security;
alter table public.sword_admin_events enable row level security;
grant select on public.sword_admin_events to anon, authenticated;

drop policy if exists "sword_chat_select" on public.sword_chat;
drop policy if exists "sword_chat_insert" on public.sword_chat;
drop policy if exists "sword_players_select" on public.sword_players;
drop policy if exists "sword_players_insert" on public.sword_players;
drop policy if exists "sword_players_update" on public.sword_players;
drop policy if exists "sword_admin_events_select" on public.sword_admin_events;

create policy "sword_chat_select" on public.sword_chat
  for select using (true);
create policy "sword_chat_insert" on public.sword_chat
  for insert with check (
    char_length(coalesce(message, '')) <= 200
    and char_length(nickname) between 1 and 20
  );

create policy "sword_players_select" on public.sword_players
  for select using (true);
create policy "sword_players_insert" on public.sword_players
  for insert with check (char_length(nickname) between 1 and 20);
create policy "sword_players_update" on public.sword_players
  for update using (true);

create policy "sword_admin_events_select" on public.sword_admin_events
  for select using (true);

alter table public.sword_players
  add column if not exists daily_gold bigint not null default 0;
alter table public.sword_players
  add column if not exists daily_gold_date date not null default current_date;

grant select, insert on public.sword_chat to anon, authenticated;
grant select, insert, update on public.sword_players to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

create or replace function public.admin_verify_sword_password(input_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select input_password = '0823';
$$;

create or replace function public.admin_reset_sword_game(input_password text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  reset_at timestamptz := now();
begin
  if input_password <> '0823' then
    raise exception 'invalid admin password';
  end if;

  truncate table public.sword_players;
  insert into public.sword_admin_events(event_type, message, created_at)
    values ('reset_users', '전체 유저 데이터 초기화', reset_at);
  insert into public.sword_chat(nickname, message, created_at)
    values ('[알림]', '관리자가 전체 유저 데이터를 초기화했습니다.', reset_at);

  return reset_at;
end;
$$;

create or replace function public.admin_start_sword_hot_time(input_password text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  started_at timestamptz := now();
begin
  if input_password <> '0823' then
    raise exception 'invalid admin password';
  end if;

  insert into public.sword_admin_events(event_type, message, created_at)
    values ('hot_time', '10분간 강화비용 5% 감소, 성공확률 5% 증가', started_at);

  return started_at;
end;
$$;

revoke all on function public.admin_verify_sword_password(text) from public;
revoke all on function public.admin_reset_sword_game(text) from public;
revoke all on function public.admin_start_sword_hot_time(text) from public;
grant execute on function public.admin_verify_sword_password(text) to anon, authenticated;
grant execute on function public.admin_reset_sword_game(text) to anon, authenticated;
grant execute on function public.admin_start_sword_hot_time(text) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.sword_admin_events;
exception when duplicate_object then
  null;
end $$;
