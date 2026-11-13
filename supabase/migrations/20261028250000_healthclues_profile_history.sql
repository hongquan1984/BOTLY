begin;

-- Keep profile revisions only while the member keeps an active saved profile.
-- Deleting/revoking that profile cascades through its private revision history.
alter table public.healthclues_profiles
  add column if not exists version integer not null default 1
  check (version > 0);

create table if not exists public.healthclues_profile_history (
  user_id uuid not null references public.healthclues_profiles(user_id) on delete cascade,
  version integer not null check (version > 0),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  consent_version text not null,
  consented_at timestamptz not null,
  changed_at timestamptz not null default now(),
  primary key (user_id, version)
);

alter table public.healthclues_profile_history enable row level security;
revoke all on public.healthclues_profile_history from public, anon, authenticated;
grant select on public.healthclues_profile_history to authenticated;
drop policy if exists owner_read_profile_history on public.healthclues_profile_history;
create policy owner_read_profile_history on public.healthclues_profile_history
  for select to authenticated
  using (user_id = auth.uid() and public.healthclues_account_access_enabled_v1());

create or replace function public.healthclues_archive_profile_revision_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.profile is distinct from new.profile
     or old.consent_version is distinct from new.consent_version
     or old.consented_at is distinct from new.consented_at then
    insert into public.healthclues_profile_history
      (user_id, version, profile, consent_version, consented_at, changed_at)
    values
      (old.user_id, old.version, old.profile, old.consent_version, old.consented_at, now())
    on conflict (user_id, version) do nothing;
    new.version := old.version + 1;
    new.updated_at := now();
  else
    -- Never allow a client to forge or reset revision metadata.
    new.version := old.version;
  end if;
  return new;
end;
$$;
revoke all on function public.healthclues_archive_profile_revision_v1() from public, anon, authenticated;

drop trigger if exists healthclues_archive_profile_revision on public.healthclues_profiles;
create trigger healthclues_archive_profile_revision
  before update on public.healthclues_profiles
  for each row execute function public.healthclues_archive_profile_revision_v1();

commit;
