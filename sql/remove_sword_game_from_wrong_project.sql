-- ============================================================
-- 잘못된 Supabase 프로젝트에 적용한 검 키우기 SQL 되돌리기
-- Supabase SQL Editor에서 "잘못 적용한 프로젝트"를 열고 이 파일을 실행하세요.
--
-- 주의:
--   public.sword_chat
--   public.sword_players
--   public.sword_admin_events
-- 위 테이블이 그 프로젝트에서 원래 쓰던 중요한 테이블이면 실행하지 마세요.
-- ============================================================

-- 1) 먼저 무엇이 있는지 확인
select
  to_regclass('public.sword_chat') as sword_chat,
  to_regclass('public.sword_players') as sword_players,
  to_regclass('public.sword_admin_events') as sword_admin_events,
  to_regprocedure('public.admin_verify_sword_password(text)') as admin_verify_sword_password,
  to_regprocedure('public.admin_reset_sword_game(text)') as admin_reset_sword_game;

-- 2) Realtime publication에서 제거
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sword_chat'
  ) then
    alter publication supabase_realtime drop table public.sword_chat;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sword_admin_events'
  ) then
    alter publication supabase_realtime drop table public.sword_admin_events;
  end if;
end $$;

-- 3) 관리자 RPC 제거
drop function if exists public.admin_verify_sword_password(text);
drop function if exists public.admin_reset_sword_game(text);

-- 4) 게임용 테이블 제거
drop table if exists public.sword_admin_events cascade;
drop table if exists public.sword_chat cascade;
drop table if exists public.sword_players cascade;
