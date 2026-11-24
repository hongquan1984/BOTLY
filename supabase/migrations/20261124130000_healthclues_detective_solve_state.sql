-- Persist the mobile detective conclusion/puzzle state through the authenticated RPC.
alter table if exists public.healthclues_detective_player_progress
  add column if not exists selected_conclusion_ids text[] not null default array[]::text[],
  add column if not exists wrong_conclusion_attempts integer not null default 0,
  add column if not exists puzzle_states jsonb not null default '{}'::jsonb;

drop function if exists public.healthclues_solve_detective_case_v1(uuid, uuid, text, integer, text[], jsonb);

create or replace function public.healthclues_solve_detective_case_v1(
  p_user_id uuid,
  p_world_id uuid,
  p_case_id text,
  p_stars integer,
  p_found_clues text[],
  p_connections jsonb,
  p_selected_conclusion_ids text[],
  p_wrong_conclusion_attempts integer,
  p_puzzle_states jsonb
) returns jsonb
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_case record;
  v_existing record;
  v_exp integer;
  v_next_case_id text;
  v_first_clear boolean := false;
begin
  select * into v_case from public.healthclues_detective_case_files where id = p_case_id;
  if not found then raise exception 'Case file does not exist: %', p_case_id; end if;

  if v_case.prerequisite_case_id is not null and not exists (
    select 1 from public.healthclues_detective_player_progress
    where user_id = p_user_id and case_id = v_case.prerequisite_case_id and status = 'solved'
  ) then
    raise exception 'Prerequisite case % has not been solved yet.', v_case.prerequisite_case_id;
  end if;

  v_exp := v_case.exp_reward + case when p_stars = 3 then 20 when p_stars = 2 then 10 else 0 end;
  select * into v_existing from public.healthclues_detective_player_progress where user_id = p_user_id and case_id = p_case_id;
  v_first_clear := v_existing is null or v_existing.status <> 'solved';

  insert into public.healthclues_detective_player_progress (
    user_id, case_id, status, found_clues, board_connections,
    selected_conclusion_ids, wrong_conclusion_attempts, puzzle_states,
    stars_awarded, exp_awarded, solved_at, updated_at
  ) values (
    p_user_id, p_case_id, 'solved', p_found_clues, p_connections,
    p_selected_conclusion_ids, p_wrong_conclusion_attempts, p_puzzle_states,
    p_stars, v_exp, now(), now()
  ) on conflict (user_id, case_id) do update set
    status = 'solved',
    stars_awarded = greatest(public.healthclues_detective_player_progress.stars_awarded, p_stars),
    found_clues = p_found_clues,
    board_connections = p_connections,
    selected_conclusion_ids = p_selected_conclusion_ids,
    wrong_conclusion_attempts = p_wrong_conclusion_attempts,
    puzzle_states = p_puzzle_states,
    exp_awarded = case when public.healthclues_detective_player_progress.status = 'solved' then public.healthclues_detective_player_progress.exp_awarded else v_exp end,
    replayed_count = public.healthclues_detective_player_progress.replayed_count + 1,
    solved_at = coalesce(public.healthclues_detective_player_progress.solved_at, now()),
    updated_at = now();

  if v_first_clear then
    insert into public.healthclues_xp_ledger (user_id, source_type, source_id, idempotency_key, amount, reason_code)
    values (p_user_id, 'learning', 'detective:' || p_case_id, 'detective-clear:' || p_case_id, v_exp, 'detective_case_solved')
    on conflict (user_id, idempotency_key) do nothing;
  end if;

  select id into v_next_case_id from public.healthclues_detective_case_files
  where chapter_id = v_case.chapter_id and chapter_order = v_case.chapter_order + 1;
  return jsonb_build_object('success', true, 'case_id', p_case_id, 'stars', p_stars,
    'first_clear', v_first_clear, 'exp_awarded', case when v_first_clear then v_exp else 0 end,
    'unlocked_next_case_id', v_next_case_id);
end;
$$;
