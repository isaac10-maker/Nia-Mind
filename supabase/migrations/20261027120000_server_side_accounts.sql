-- Compte et rôle SuperAdmin décidés uniquement côté serveur.
-- Les colonnes ajoutées servent au coffre privé déjà protégé par RLS.

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists preferred_language text default 'fr',
  add column if not exists is_online boolean not null default false,
  add column if not exists is_banned boolean not null default false,
  add column if not exists ban_reason text,
  add column if not exists banned_at timestamptz,
  add column if not exists is_removed boolean not null default false;

alter table public.assistant_conversations
  add column if not exists handed_over boolean not null default false,
  add column if not exists diagnostic_sent_at timestamptz;

alter table public.assistant_messages
  add column if not exists offer_handover boolean not null default false,
  add column if not exists is_diagnostic boolean not null default false;

alter table public.questionnaire_responses
  add column if not exists questionnaire_title text not null default '';

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  where con.conrelid = 'public.assistant_messages'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%sender%';
  if constraint_name is not null then
    execute format('alter table public.assistant_messages drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.assistant_messages
  drop constraint if exists assistant_messages_sender_check;

alter table public.assistant_messages
  add constraint assistant_messages_sender_check
  check (sender in ('user', 'assistant', 'admin'));

create or replace function public.guard_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if new.role = 'admin' then
    select lower(email) into target_email from auth.users where id = new.user_id;
    if target_email is distinct from 'isaacamegan10@gmail.com' then
      raise exception 'SECURITY: le rôle admin est réservé au SuperAdmin officiel et n’est jamais décidé par le navigateur.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_admin_role on public.user_roles;
create trigger trg_guard_admin_role
  before insert or update on public.user_roles
  for each row
  execute function public.guard_admin_role();

create or replace function public.ensure_superadmin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text;
begin
  if auth.uid() is null then
    return false;
  end if;
  select lower(email) into caller_email from auth.users where id = auth.uid();
  if caller_email is distinct from 'isaacamegan10@gmail.com' then
    return false;
  end if;
  insert into public.user_roles (user_id, role, assigned_by)
  values (auth.uid(), 'admin', auth.uid())
  on conflict (user_id) do update set role = 'admin';
  return true;
end;
$$;

revoke all on function public.ensure_superadmin() from public, anon;
grant execute on function public.ensure_superadmin() to authenticated;

create or replace function public.guard_profile_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.is_banned is true and exists (
      select 1 from auth.users where id = new.id and lower(email) = 'isaacamegan10@gmail.com'
    ) then
      raise exception 'SECURITY: le SuperAdmin officiel ne peut pas être suspendu.';
    end if;
    if (
      new.is_banned is distinct from old.is_banned
      or new.ban_reason is distinct from old.ban_reason
      or new.banned_at is distinct from old.banned_at
      or new.is_removed is distinct from old.is_removed
    ) and not public.is_admin() then
      raise exception 'SECURITY: seul le SuperAdmin peut suspendre ou retirer un compte.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_moderation on public.profiles;
create trigger trg_guard_profile_moderation
  before update on public.profiles
  for each row
  execute function public.guard_profile_moderation();

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
