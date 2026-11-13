-- Persistent collectible learning resources. Awarding is driven by inserts made
-- inside the server-owned discovery and Boss-clear transactions.
create table if not exists public.healthclues_knowledge_currency_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  currency_type text not null check(currency_type in ('fragment','key')),
  amount integer not null check(amount>0 and amount<=10),
  source_type text not null check(source_type in ('clue_discovery','boss_clear')),
  source_id text not null check(length(source_id) between 1 and 240),
  idempotency_key text not null check(length(idempotency_key) between 1 and 300),
  created_at timestamptz not null default now(),
  unique(user_id,idempotency_key),
  unique(user_id,world_id,currency_type,source_type,source_id),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
create index if not exists healthclues_knowledge_currency_user_idx
  on public.healthclues_knowledge_currency_ledger(user_id,world_id,currency_type,created_at desc);
alter table public.healthclues_knowledge_currency_ledger enable row level security;
revoke all on public.healthclues_knowledge_currency_ledger from public,anon,authenticated;
grant select on public.healthclues_knowledge_currency_ledger to authenticated;
grant all on public.healthclues_knowledge_currency_ledger to service_role;
drop policy if exists owner_read_knowledge_currency on public.healthclues_knowledge_currency_ledger;
create policy owner_read_knowledge_currency on public.healthclues_knowledge_currency_ledger
  for select to authenticated using(user_id=auth.uid());

create or replace function public.healthclues_award_knowledge_currency_v1()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.healthclues_knowledge_currency_ledger(
    user_id,world_id,currency_type,amount,source_type,source_id,idempotency_key
  ) values(
    new.user_id,new.world_id,'fragment',1,'clue_discovery',new.clue_id||':'||new.clue_version,
    'knowledge-fragment:'||new.user_id::text||':'||new.clue_id||':'||new.clue_version
  ) on conflict(user_id,idempotency_key) do nothing;
  return new;
end; $$;
revoke all on function public.healthclues_award_knowledge_currency_v1() from public,anon,authenticated;
drop trigger if exists healthclues_knowledge_fragment_award on public.healthclues_knowledge_discoveries;
create trigger healthclues_knowledge_fragment_award after insert on public.healthclues_knowledge_discoveries
  for each row execute function public.healthclues_award_knowledge_currency_v1();

create or replace function public.healthclues_award_boss_knowledge_key_v1()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.healthclues_knowledge_currency_ledger(
    user_id,world_id,currency_type,amount,source_type,source_id,idempotency_key
  ) values(
    new.user_id,new.world_id,'key',1,'boss_clear',new.boss_id||':'||new.boss_version,
    'knowledge-key:'||new.user_id::text||':'||new.world_id::text||':'||new.boss_id||':'||new.boss_version
  ) on conflict(user_id,idempotency_key) do nothing;
  return new;
end; $$;
revoke all on function public.healthclues_award_boss_knowledge_key_v1() from public,anon,authenticated;
drop trigger if exists healthclues_boss_key_award on public.healthclues_boss_clears;
create trigger healthclues_boss_key_award after insert on public.healthclues_boss_clears
  for each row execute function public.healthclues_award_boss_knowledge_key_v1();
notify pgrst,'reload schema';
