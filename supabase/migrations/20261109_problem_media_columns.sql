-- 문제 페이지 영상 시작 지점·제목·출처 열 추가
-- 적용 순서: 20261030_problem_market.sql → 이 파일 → 20261109_seed_problems.sql
-- 적용 전에는 아무 영향이 없습니다 (화면은 코드 목록 그대로 나옵니다).

alter table public.expo_problems add column if not exists video_start  int;
alter table public.expo_problems add column if not exists video_title  text;
alter table public.expo_problems add column if not exists video_source text check (video_source in ('kaftv','dof'));

alter table public.expo_problems enable row level security;
-- 서비스 역할 키(서버)만 읽고 씁니다. 공개 정책은 두지 않습니다.
