-- HealthClues Mystery Detective: Case File Campaign System Migration
-- Standalone, idempotent migration with RLS, campaign unlocking, and shared XP ledger integration.

-- 1. Detective Chapters Table
create table if not exists public.healthclues_detective_chapters (
  id text primary key,
  chapter_number integer not null unique,
  title text not null,
  subtitle text not null,
  description text not null,
  region text not null,
  icon text not null default '🌙',
  color text not null default '#6366f1',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Detective Case Files Table
create table if not exists public.healthclues_detective_case_files (
  id text primary key,
  chapter_id text not null references public.healthclues_detective_chapters(id) on delete cascade,
  chapter_order integer not null,
  prerequisite_case_id text references public.healthclues_detective_case_files(id) on delete set null,
  title text not null,
  subtitle text not null,
  topic text not null,
  region text not null,
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  content_version integer not null default 1,
  publication_status text not null default 'published' check (publication_status in ('draft', 'review', 'approved', 'published')),
  exp_reward integer not null default 50,
  case_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_detective_chapter_order unique(chapter_id, chapter_order)
);

-- 3. Player Case Progress Table
create table if not exists public.healthclues_detective_player_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null references public.healthclues_detective_case_files(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('available', 'in_progress', 'solved')),
  found_clues text[] not null default array[]::text[],
  inspected_hotspots text[] not null default array[]::text[],
  board_connections jsonb not null default '[]'::jsonb,
  revealed_contradictions text[] not null default array[]::text[],
  stars_awarded integer not null default 0 check (stars_awarded between 0 and 3),
  exp_awarded integer not null default 0,
  replayed_count integer not null default 0,
  started_at timestamptz not null default now(),
  solved_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint uq_detective_user_case unique(user_id, case_id)
);

create index if not exists idx_detective_user_progress on public.healthclues_detective_player_progress(user_id, status);

-- 4. Enable Row Level Security (RLS)
alter table public.healthclues_detective_chapters enable row level security;
alter table public.healthclues_detective_case_files enable row level security;
alter table public.healthclues_detective_player_progress enable row level security;

-- Chapters & Published Cases are readable by all authenticated users
drop policy if exists "Chapters are viewable by authenticated users" on public.healthclues_detective_chapters;
create policy "Chapters are viewable by authenticated users"
  on public.healthclues_detective_chapters for select
  to authenticated using (is_published = true);

drop policy if exists "Published cases are viewable by authenticated users" on public.healthclues_detective_case_files;
create policy "Published cases are viewable by authenticated users"
  on public.healthclues_detective_case_files for select
  to authenticated using (publication_status = 'published');

-- Player Progress is isolated to the authenticated owner
drop policy if exists "Players can view their own detective progress" on public.healthclues_detective_player_progress;
create policy "Players can view their own detective progress"
  on public.healthclues_detective_player_progress for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "Players can insert their own detective progress" on public.healthclues_detective_player_progress;
create policy "Players can insert their own detective progress"
  on public.healthclues_detective_player_progress for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "Players can update their own detective progress" on public.healthclues_detective_player_progress;
create policy "Players can update their own detective progress"
  on public.healthclues_detective_player_progress for update
  to authenticated using (auth.uid() = user_id);

-- 5. Server-side Authorized Case Completion RPC
-- Validates prerequisite unlocking, saves progress, and awards EXP idempotently via 'learning' source.
create or replace function public.healthclues_solve_detective_case_v1(
  p_user_id uuid,
  p_world_id uuid,
  p_case_id text,
  p_stars integer,
  p_found_clues text[],
  p_connections jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_case record;
  v_prereq_solved boolean;
  v_existing record;
  v_exp integer;
  v_next_case_id text;
  v_first_clear boolean := false;
begin
  -- 1. Fetch case details
  select * into v_case from public.healthclues_detective_case_files where id = p_case_id;
  if not found then
    raise exception 'Case file does not exist: %', p_case_id;
  end if;

  -- 2. Validate unlock prerequisite
  if v_case.prerequisite_case_id is not null then
    select (status = 'solved') into v_prereq_solved
    from public.healthclues_detective_player_progress
    where user_id = p_user_id and case_id = v_case.prerequisite_case_id;

    if v_prereq_solved is not true then
      raise exception 'Prerequisite case % has not been solved yet.', v_case.prerequisite_case_id;
    end if;
  end if;

  -- 3. Calculate reward EXP
  v_exp := v_case.exp_reward;
  if p_stars = 3 then
    v_exp := v_exp + 20;
  elsif p_stars = 2 then
    v_exp := v_exp + 10;
  end if;

  -- 4. Check if first clear
  select * into v_existing from public.healthclues_detective_player_progress
  where user_id = p_user_id and case_id = p_case_id;

  if v_existing is null or v_existing.status != 'solved' then
    v_first_clear := true;
  end if;

  -- 5. Upsert player progress
  insert into public.healthclues_detective_player_progress (
    user_id, case_id, status, found_clues, board_connections,
    stars_awarded, exp_awarded, solved_at, updated_at
  ) values (
    p_user_id, p_case_id, 'solved', p_found_clues, p_connections,
    p_stars, v_exp, now(), now()
  )
  on conflict (user_id, case_id) do update set
    status = 'solved',
    stars_awarded = greatest(healthclues_detective_player_progress.stars_awarded, p_stars),
    found_clues = p_found_clues,
    board_connections = p_connections,
    replayed_count = healthclues_detective_player_progress.replayed_count + 1,
    solved_at = coalesce(healthclues_detective_player_progress.solved_at, now()),
    updated_at = now();

  -- 6. Integrate with existing XP Ledger idempotently (award only on first clear using 'learning' source)
  if v_first_clear then
    insert into public.healthclues_xp_ledger (
      user_id, source_type, source_id, idempotency_key, amount, reason_code
    ) values (
      p_user_id,
      'learning',
      'detective:' || p_case_id,
      'detective-clear:' || p_case_id,
      v_exp,
      'detective_case_solved'
    )
    on conflict (user_id, idempotency_key) do nothing;
  end if;

  -- 7. Determine next case in chapter to unlock
  select id into v_next_case_id
  from public.healthclues_detective_case_files
  where chapter_id = v_case.chapter_id and chapter_order = v_case.chapter_order + 1;

  return jsonb_build_object(
    'success', true,
    'case_id', p_case_id,
    'stars', p_stars,
    'first_clear', v_first_clear,
    'exp_awarded', case when v_first_clear then v_exp else 0 end,
    'unlocked_next_case_id', v_next_case_id
  );
end;
$$;

-- 6. Seed Default Chapter 1 & Cases
insert into public.healthclues_detective_chapters (
  id, chapter_number, title, subtitle, description, region, icon, color
) values (
  'chapter-01', 1,
  'Chương 1: Những Bí Ẩn Lúc Nửa Đêm',
  'Khởi đầu hành trình thám tử sức khỏe cùng Luna',
  'Điều tra các hiện tượng sức khỏe kỳ lạ xảy ra trong màn đêm: từ mất ngủ bí ẩn tại Thung lũng Giấc ngủ đến cơn đau khớp bất ngờ lúc 2 giờ sáng tại Vương Quốc HealthClues.',
  'Sleep Valley & HealthClues Realm', '🌙', '#6366f1'
) on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description;

insert into public.healthclues_detective_case_files (
  id, chapter_id, chapter_order, prerequisite_case_id, title, subtitle,
  topic, region, difficulty, exp_reward, publication_status
) values
(
  'case-sleep-001', 'chapter-01', 1, null,
  'Bí ẩn đêm không ngủ',
  'Vì sao An kiệt sức cả ngày nhưng đặt lưng xuống là mắt thao láo?',
  'sleep', 'Sleep Valley', 1, 50, 'published'
),
(
  'case-gout-002', 'chapter-01', 2, 'case-sleep-001',
  'Bí ẩn cơn đau lúc nửa đêm',
  'Minh tin chắc cơn gout bùng phát do thịt bò, nhưng dữ liệu thời gian lại nói khác!',
  'gout', 'HealthClues Realm', 2, 75, 'published'
),
(
  'case-migraine-003', 'chapter-01', 3, 'case-gout-002',
  'Hồ sơ cơn đau bí ẩn',
  'Cơn đau đầu âm ỉ sau tuần làm việc căng thẳng: Tìm kiếm các yếu tố khởi phát.',
  'migraine', 'HealthClues Realm', 3, 60, 'published'
)
on conflict (id) do update set
  chapter_order = excluded.chapter_order,
  prerequisite_case_id = excluded.prerequisite_case_id,
  title = excluded.title,
  subtitle = excluded.subtitle,
  difficulty = excluded.difficulty,
  exp_reward = excluded.exp_reward,
  publication_status = excluded.publication_status;
