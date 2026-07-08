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
  updated_at timestamptz not null default now()
);

alter table public.sword_chat enable row level security;
alter table public.sword_players enable row level security;

-- 익명(로그인 없음) 게임이므로 읽기/쓰기를 열어두되 길이 제한을 둔다
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

-- 채팅 실시간 구독 활성화
alter publication supabase_realtime add table public.sword_chat;
