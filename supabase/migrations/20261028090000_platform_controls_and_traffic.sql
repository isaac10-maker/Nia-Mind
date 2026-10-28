-- Réglages publics de la plateforme (aucun secret) et compteur de visites anonyme.

create table if not exists public.platform_controls (
  id integer primary key default 1 check (id = 1),
  registration_open boolean not null default true,
  story_submissions_open boolean not null default true,
  listening_open boolean not null default true,
  public_stories_visible boolean not null default true,
  announcement_visible boolean not null default true,
  maintenance_mode boolean not null default false,
  copy_protection_enabled boolean not null default true,
  ai_autopilot_tips_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.platform_controls (id)
values (1)
on conflict (id) do nothing;

alter table public.platform_controls enable row level security;
alter table public.platform_controls force row level security;

drop policy if exists platform_controls_public_read on public.platform_controls;
create policy platform_controls_public_read
  on public.platform_controls for select
  using (true);

drop policy if exists platform_controls_admin_write on public.platform_controls;
create policy platform_controls_admin_write
  on public.platform_controls for update
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.platform_controls from anon, authenticated;
grant select on table public.platform_controls to anon, authenticated;
grant update on table public.platform_controls to authenticated;

create table if not exists public.site_traffic_daily (
  day date not null,
  path text not null,
  views integer not null default 0 check (views >= 0),
  primary key (day, path)
);

alter table public.site_traffic_daily enable row level security;
alter table public.site_traffic_daily force row level security;

drop policy if exists site_traffic_admin_read on public.site_traffic_daily;
create policy site_traffic_admin_read
  on public.site_traffic_daily for select
  using (public.is_admin());

revoke all on table public.site_traffic_daily from anon, authenticated;
grant select on table public.site_traffic_daily to authenticated;

create or replace function public.record_page_view(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text;
begin
  clean := left(coalesce(p_path, '/'), 80);
  if clean not in (
    '/',
    '/conseils',
    '/histoires',
    '/ressources',
    '/loisir',
    '/a-propos',
    '/connexion',
    '/inscription'
  ) then
    return;
  end if;

  insert into public.site_traffic_daily (day, path, views)
  values ((timezone('utc', now()))::date, clean, 1)
  on conflict (day, path)
  do update set views = public.site_traffic_daily.views + 1;
end;
$$;

revoke all on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;
