-- ============================================================
-- 검 키우기: 온라인 채팅/랭킹 테이블 설정
-- Supabase 대시보드 → SQL Editor에 전체를 붙여넣고 Run 하세요.
-- ============================================================

-- 채팅 메시지
create table if not exists public.sword_chat (
  id bigint generated always as identity primary key,
  nickname text not null,
  message text,
  item_level int,
  item_name text,
  created_at timestamptz not null default now()
);

-- 플레이어 골드 (랭킹용, 브라우저별 client_id로 식별)
create table if not exists public.sword_players (
  client_id uuid primary key,
  nickname text not null,
  gold bigint not null default 0,
  daily_gold bigint not null default 0,
  daily_gold_date date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table public.sword_players
  add column if not exists daily_gold bigint not null default 0;
alter table public.sword_players
  add column if not exists daily_gold_date date not null default current_date;

-- 관리자 이벤트. 전체 초기화 같은 명령을 접속 중/다음 접속 클라이언트에 알린다.
create table if not exists public.sword_admin_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.sword_chat enable row level security;
alter table public.sword_players enable row level security;
alter table public.sword_admin_events enable row level security;

-- 익명(로그인 없음) 게임이므로 읽기/쓰기를 열어두되 길이 제한을 둔다
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

-- 관리자 비밀번호는 실제 배포 전에 CHANGE_ME_ADMIN_PASSWORD를 원하는 값으로 바꾸세요.
-- 클라이언트에서는 채팅창에 /admin login <비밀번호>로 로그인한 뒤 명령어를 실행합니다.
create or replace function public.admin_verify_sword_password(input_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select input_password = 'CHANGE_ME_ADMIN_PASSWORD';
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
  if input_password <> 'CHANGE_ME_ADMIN_PASSWORD' then
    raise exception 'invalid admin password';
  end if;

  delete from public.sword_players;
  insert into public.sword_admin_events(event_type, message, created_at)
    values ('reset_users', '전체 유저 데이터 초기화', reset_at);
  insert into public.sword_chat(nickname, message, created_at)
    values ('[알림]', '관리자가 전체 유저 데이터를 초기화했습니다.', reset_at);

  return reset_at;
end;
$$;

revoke all on function public.admin_verify_sword_password(text) from public;
revoke all on function public.admin_reset_sword_game(text) from public;
grant execute on function public.admin_verify_sword_password(text) to anon, authenticated;
grant execute on function public.admin_reset_sword_game(text) to anon, authenticated;

-- 채팅 실시간 구독 활성화
do $$
begin
  alter publication supabase_realtime add table public.sword_chat;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sword_admin_events;
exception when duplicate_object then
  null;
end $$;
