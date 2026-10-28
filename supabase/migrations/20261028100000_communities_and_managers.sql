-- Annuaire Communautés et sous-administrateurs.
-- Les écritures passent par des fonctions security definer.
-- RLS est forcé et aucun droit direct n'est accordé aux clients.

create table if not exists public.community_settings (
  id integer primary key default 1 check (id = 1),
  require_approval boolean not null default true,
  revalidate_on_major_edit boolean not null default true,
  extra_hosts text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.community_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'users',
  sort_order integer not null default 0,
  color text,
  is_active boolean not null default true,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  can_create boolean not null default true,
  can_edit_own boolean not null default true,
  can_submit boolean not null default true,
  can_archive_own boolean not null default false,
  can_publish_directly boolean not null default false,
  can_moderate_all boolean not null default false,
  appointed_by uuid,
  appointed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cover_url text,
  short_description text not null default '',
  long_description text not null default '',
  platform text not null check (platform in ('whatsapp_group', 'whatsapp_channel', 'facebook_page', 'facebook_group', 'other')),
  destination_url text not null,
  primary_category_id uuid not null references public.community_categories(id),
  language text not null default 'fr' check (language in ('fr', 'en', 'es', 'de', 'zh')),
  country_code text,
  organizer_name text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected', 'suspended', 'archived')),
  rejection_reason text,
  verified boolean not null default false,
  is_sponsored boolean not null default false,
  responsible_ack boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_category_links (
  community_id uuid not null references public.communities(id) on delete cascade,
  category_id uuid not null references public.community_categories(id) on delete cascade,
  primary key (community_id, category_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  reporter_id uuid,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  decision_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.community_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists communities_status_idx on public.communities (status, published_at desc);
create index if not exists communities_owner_idx on public.communities (owner_id, status);

alter table public.community_settings enable row level security;
alter table public.community_settings force row level security;
alter table public.community_categories enable row level security;
alter table public.community_categories force row level security;
alter table public.community_managers enable row level security;
alter table public.community_managers force row level security;
alter table public.communities enable row level security;
alter table public.communities force row level security;
alter table public.community_category_links enable row level security;
alter table public.community_category_links force row level security;
alter table public.community_reports enable row level security;
alter table public.community_reports force row level security;
alter table public.community_audit_logs enable row level security;
alter table public.community_audit_logs force row level security;

revoke all on table public.community_settings from public, anon, authenticated;
revoke all on table public.community_categories from public, anon, authenticated;
revoke all on table public.community_managers from public, anon, authenticated;
revoke all on table public.communities from public, anon, authenticated;
revoke all on table public.community_category_links from public, anon, authenticated;
revoke all on table public.community_reports from public, anon, authenticated;
revoke all on table public.community_audit_logs from public, anon, authenticated;

drop policy if exists community_settings_deny on public.community_settings;
create policy community_settings_deny on public.community_settings for all using (false);
drop policy if exists community_categories_deny on public.community_categories;
create policy community_categories_deny on public.community_categories for all using (false);
drop policy if exists community_managers_deny on public.community_managers;
create policy community_managers_deny on public.community_managers for all using (false);
drop policy if exists communities_deny on public.communities;
create policy communities_deny on public.communities for all using (false);
drop policy if exists community_links_deny on public.community_category_links;
create policy community_links_deny on public.community_category_links for all using (false);
drop policy if exists community_reports_deny on public.community_reports;
create policy community_reports_deny on public.community_reports for all using (false);
drop policy if exists community_audit_deny on public.community_audit_logs;
create policy community_audit_deny on public.community_audit_logs for all using (false);

create or replace function public.community_audit(
  p_action text,
  p_type text,
  p_target text,
  p_summary text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_audit_logs (actor_id, action, target_type, target_id, summary)
  values (auth.uid(), left(p_action, 80), left(p_type, 40), left(p_target, 80), left(p_summary, 400));
end;
$$;

create or replace function public.is_safe_community_url(raw text)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  cleaned text;
  host text;
  allowed text[] := array[
    'chat.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com', 'wa.me',
    'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'fb.me', 'm.me',
    'instagram.com', 'www.instagram.com', 'threads.net', 'www.threads.net'
  ];
  extra text[];
begin
  if raw is null then return false; end if;
  cleaned := btrim(raw);
  if length(cleaned) = 0 or length(cleaned) > 500 then return false; end if;
  if cleaned !~* '^https://' then return false; end if;
  if cleaned ~* '(javascript\s*:|data\s*:|vbscript\s*:|file\s*:)' then return false; end if;
  if cleaned ~* '^https://[^/]*@' then return false; end if;
  host := lower(substring(cleaned from '^https://([^/:?#]+)'));
  if host is null or host = '' then return false; end if;
  if host = any(allowed) then return true; end if;
  select extra_hosts into extra from public.community_settings where id = 1;
  return extra is not null and host = any(extra);
end;
$$;

create or replace function public.community_host_matches(p_platform text, p_url text)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  host text;
begin
  if not public.is_safe_community_url(p_url) then return false; end if;
  host := lower(substring(btrim(p_url) from '^https://([^/:?#]+)'));
  if p_platform in ('whatsapp_group', 'whatsapp_channel') then
    return host = any(array['chat.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com', 'wa.me']);
  end if;
  if p_platform in ('facebook_page', 'facebook_group') then
    return host = any(array['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'fb.me', 'm.me']);
  end if;
  return public.is_safe_community_url(p_url);
end;
$$;

create or replace function public.active_community_manager(p_user uuid default auth.uid())
returns public.community_managers
language sql
stable
security definer
set search_path = public
as $$
  select * from public.community_managers
  where user_id = p_user and status = 'active'
  limit 1;
$$;

create or replace function public.my_community_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  manager public.community_managers;
begin
  if auth.uid() is null then
    return jsonb_build_object('authenticated', false, 'is_superadmin', false, 'is_manager', false, 'status', 'none');
  end if;
  select * into manager from public.community_managers where user_id = auth.uid();
  return jsonb_build_object(
    'authenticated', true,
    'is_superadmin', public.is_admin(),
    'is_manager', manager.user_id is not null and manager.status = 'active',
    'status', coalesce(manager.status, 'none'),
    'can_create', coalesce(manager.can_create, false),
    'can_edit_own', coalesce(manager.can_edit_own, false),
    'can_submit', coalesce(manager.can_submit, false),
    'can_archive_own', coalesce(manager.can_archive_own, false),
    'can_publish_directly', coalesce(manager.can_publish_directly, false),
    'can_moderate_all', coalesce(manager.can_moderate_all, false)
  );
end;
$$;

create or replace function public.list_community_categories(p_include_inactive boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'code', code, 'name', name, 'description', description,
      'icon', icon, 'sort_order', sort_order, 'color', color,
      'is_active', is_active, 'is_sensitive', is_sensitive
    ) order by sort_order, name)
    from public.community_categories
    where is_active or (p_include_inactive and public.is_admin())
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_published_communities(
  p_search text default '',
  p_platform text default '',
  p_category uuid default null,
  p_language text default '',
  p_sort text default 'new',
  p_limit integer default 12,
  p_offset integer default 0
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 12), 1), 24);
  off integer := greatest(coalesce(p_offset, 0), 0);
  needle text := nullif(btrim(coalesce(p_search, '')), '');
begin
  return coalesce((
    select jsonb_agg(row_to_json(q))
    from (
      select
        c.id, c.name, c.cover_url, c.short_description, c.long_description,
        c.platform, c.destination_url, c.language, c.country_code, c.organizer_name,
        c.tags, c.verified, c.is_sponsored, c.published_at,
        cat.code as category_code, cat.name as category_name, cat.color as category_color,
        (
          cat.is_sensitive
          or exists (
            select 1 from public.community_category_links sl
            join public.community_categories ss on ss.id = sl.category_id
            where sl.community_id = c.id and ss.is_sensitive
          )
        ) as is_sensitive,
        (
          select coalesce(jsonb_agg(jsonb_build_object('code', sc.code, 'name', sc.name)), '[]'::jsonb)
          from public.community_category_links l
          join public.community_categories sc on sc.id = l.category_id
          where l.community_id = c.id and sc.is_active
        ) as secondary_categories
      from public.communities c
      join public.community_categories cat on cat.id = c.primary_category_id
      where c.status = 'published'
        and cat.is_active
        and (p_platform = '' or c.platform = p_platform)
        and (p_language = '' or c.language = p_language)
        and (
          p_category is null
          or c.primary_category_id = p_category
          or exists (
            select 1 from public.community_category_links l
            where l.community_id = c.id and l.category_id = p_category
          )
        )
        and (
          needle is null
          or c.name ilike '%' || needle || '%'
          or c.short_description ilike '%' || needle || '%'
          or c.long_description ilike '%' || needle || '%'
          or exists (select 1 from unnest(c.tags) tag where tag ilike '%' || needle || '%')
        )
      order by
        case when p_sort = 'relevance' and needle is not null and c.name ilike needle || '%' then 0 else 1 end,
        c.published_at desc nulls last
      limit lim offset off
    ) q
  ), '[]'::jsonb);
end;
$$;

create or replace function public.save_community(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  manager public.community_managers;
  cid uuid;
  current public.communities;
  cat public.community_categories;
  policy public.community_settings;
  next_status text;
  major boolean := false;
  cover text;
  dest text;
  platform text;
  tags text[];
begin
  if actor is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into policy from public.community_settings where id = 1;
  select * into manager from public.community_managers where user_id = actor;
  if not public.is_admin() and (manager.user_id is null or manager.status <> 'active' or not manager.can_edit_own) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  if not public.is_admin() and not manager.can_create and nullif(p_payload->>'id', '') is null then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;

  platform := p_payload->>'platform';
  dest := btrim(coalesce(p_payload->>'destination_url', ''));
  cover := nullif(btrim(coalesce(p_payload->>'cover_url', '')), '');
  if platform not in ('whatsapp_group', 'whatsapp_channel', 'facebook_page', 'facebook_group', 'other') then
    raise exception 'COMMUNITY_INVALID_PLATFORM';
  end if;
  if coalesce(p_payload->>'language', 'fr') not in ('fr', 'en', 'es', 'de', 'zh') then
    raise exception 'COMMUNITY_INVALID_TEXT';
  end if;
  if coalesce(p_payload->>'primary_category_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'COMMUNITY_CATEGORY_INACTIVE';
  end if;
  if not public.community_host_matches(platform, dest) then
    raise exception 'COMMUNITY_INVALID_URL';
  end if;
  if cover is not null and (cover !~* '^https://' or cover ~* '(javascript\s*:|data\s*:)' or length(cover) > 500) then
    raise exception 'COMMUNITY_INVALID_COVER';
  end if;
  if public.contains_malicious_payload(coalesce(p_payload->>'name', '') || coalesce(p_payload->>'short_description', '') || coalesce(p_payload->>'long_description', '')) then
    raise exception 'COMMUNITY_UNSAFE_TEXT';
  end if;
  if length(btrim(coalesce(p_payload->>'name', ''))) < 2 or length(p_payload->>'name') > 80 then
    raise exception 'COMMUNITY_INVALID_NAME';
  end if;
  if length(coalesce(p_payload->>'short_description', '')) > 180 or length(coalesce(p_payload->>'long_description', '')) > 2000 then
    raise exception 'COMMUNITY_INVALID_TEXT';
  end if;

  select * into cat from public.community_categories
  where id = (p_payload->>'primary_category_id')::uuid and is_active;
  if cat.id is null then raise exception 'COMMUNITY_CATEGORY_INACTIVE'; end if;
  if cat.is_sensitive and coalesce((p_payload->>'responsible_ack')::boolean, false) is not true then
    raise exception 'COMMUNITY_SENSITIVE_ACK_REQUIRED';
  end if;

  if jsonb_typeof(p_payload->'tags') = 'array' then
    select coalesce(array_agg(item), '{}')
    into tags
    from (
      select left(btrim(value), 24) as item
      from jsonb_array_elements_text(p_payload->'tags')
      where btrim(value) <> ''
      limit 8
    ) limited;
  else
    tags := '{}';
  end if;

  cid := nullif(p_payload->>'id', '')::uuid;
  if cid is not null then
    select * into current from public.communities where id = cid;
    if current.id is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
    if not public.is_admin() and current.owner_id <> actor then
      raise exception 'COMMUNITY_NOT_OWNER';
    end if;
    major := current.status = 'published' and (
      current.destination_url is distinct from dest
      or current.name is distinct from btrim(p_payload->>'name')
      or current.short_description is distinct from coalesce(p_payload->>'short_description', '')
      or current.long_description is distinct from coalesce(p_payload->>'long_description', '')
    );
    next_status := current.status;
    if current.status = 'rejected' then next_status := 'draft'; end if;
    if major and policy.revalidate_on_major_edit and not (public.is_admin() or manager.can_publish_directly) then
      next_status := 'pending';
    end if;
    update public.communities set
      name = btrim(p_payload->>'name'),
      cover_url = cover,
      short_description = left(coalesce(p_payload->>'short_description', ''), 180),
      long_description = left(coalesce(p_payload->>'long_description', ''), 2000),
      platform = platform,
      destination_url = dest,
      primary_category_id = cat.id,
      language = coalesce(nullif(p_payload->>'language', ''), 'fr'),
      country_code = nullif(left(coalesce(p_payload->>'country_code', ''), 8), ''),
      organizer_name = nullif(left(coalesce(p_payload->>'organizer_name', ''), 80), ''),
      tags = coalesce(tags, '{}'),
      status = next_status,
      responsible_ack = coalesce((p_payload->>'responsible_ack')::boolean, false),
      rejection_reason = case when next_status = 'draft' then null else rejection_reason end,
      updated_at = now()
    where id = cid;
  else
    insert into public.communities (
      owner_id, name, cover_url, short_description, long_description, platform, destination_url,
      primary_category_id, language, country_code, organizer_name, tags, status, responsible_ack
    ) values (
      actor,
      btrim(p_payload->>'name'),
      cover,
      left(coalesce(p_payload->>'short_description', ''), 180),
      left(coalesce(p_payload->>'long_description', ''), 2000),
      platform,
      dest,
      cat.id,
      coalesce(nullif(p_payload->>'language', ''), 'fr'),
      nullif(left(coalesce(p_payload->>'country_code', ''), 8), ''),
      nullif(left(coalesce(p_payload->>'organizer_name', ''), 80), ''),
      coalesce(tags, '{}'),
      'draft',
      coalesce((p_payload->>'responsible_ack')::boolean, false)
    ) returning id into cid;
  end if;

  delete from public.community_category_links where community_id = cid;
  if jsonb_typeof(p_payload->'secondary_category_ids') = 'array' then
    insert into public.community_category_links (community_id, category_id)
    select cid, ids.item_id
    from (
      select value::uuid as item_id
      from jsonb_array_elements_text(p_payload->'secondary_category_ids')
      where value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) ids
    join public.community_categories sc on sc.id = ids.item_id and sc.is_active
    where ids.item_id <> cat.id
    on conflict do nothing;
  end if;

  perform public.community_audit('COMMUNITY_SAVED', 'community', cid::text, 'Fiche enregistrée en brouillon ou mise à jour privée.');
  return cid;
end;
$$;

create or replace function public.submit_community(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  row public.communities;
  manager public.community_managers;
  policy public.community_settings;
  next_status text := 'pending';
begin
  if actor is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into row from public.communities where id = p_id;
  if row.id is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  if not public.is_admin() and row.owner_id <> actor then raise exception 'COMMUNITY_NOT_OWNER'; end if;
  if row.status not in ('draft', 'rejected') then raise exception 'COMMUNITY_INVALID_STATUS'; end if;
  select * into manager from public.community_managers where user_id = actor and status = 'active';
  if not public.is_admin() and (manager.user_id is null or not manager.can_submit) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  select * into policy from public.community_settings where id = 1;
  if public.is_admin()
     or coalesce(manager.can_publish_directly, false)
     or coalesce(policy.require_approval, true) = false then
    next_status := 'published';
  end if;
  update public.communities
  set status = next_status,
      rejection_reason = null,
      published_at = case when next_status = 'published' then now() else published_at end,
      updated_at = now()
  where id = p_id;
  perform public.community_audit('COMMUNITY_SUBMITTED', 'community', p_id::text, 'Soumission : ' || next_status);
  return next_status;
end;
$$;

create or replace function public.moderate_community(p_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.communities;
  manager public.community_managers;
  sensitive boolean;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into manager from public.community_managers where user_id = auth.uid() and status = 'active';
  if not public.is_admin() and not coalesce(manager.can_moderate_all, false) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  if p_status not in ('published', 'rejected', 'suspended', 'archived', 'pending', 'draft') then
    raise exception 'COMMUNITY_INVALID_STATUS';
  end if;
  if p_status = 'rejected' and length(btrim(coalesce(p_note, ''))) < 4 then
    raise exception 'COMMUNITY_REASON_REQUIRED';
  end if;
  select * into row from public.communities where id = p_id;
  if row.id is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  if row.status is distinct from p_status and not (
    (row.status = 'draft' and p_status in ('pending', 'archived'))
    or (row.status = 'pending' and p_status in ('published', 'rejected', 'suspended', 'archived'))
    or (row.status = 'published' and p_status in ('suspended', 'archived', 'pending'))
    or (row.status = 'rejected' and p_status in ('pending', 'archived', 'draft'))
    or (row.status = 'suspended' and p_status in ('published', 'archived', 'pending'))
    or (row.status = 'archived' and p_status in ('draft', 'pending'))
  ) then
    raise exception 'COMMUNITY_INVALID_STATUS';
  end if;
  if p_status = 'published' and not public.community_host_matches(row.platform, row.destination_url) then
    raise exception 'COMMUNITY_INVALID_URL';
  end if;
  select is_sensitive into sensitive from public.community_categories where id = row.primary_category_id;
  if p_status = 'published' and coalesce(sensitive, false) and not row.responsible_ack then
    raise exception 'COMMUNITY_SENSITIVE_ACK_REQUIRED';
  end if;
  update public.communities
  set status = p_status,
      rejection_reason = case when p_status = 'rejected' then left(btrim(p_note), 500) else null end,
      published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end,
      updated_at = now()
  where id = p_id;
  perform public.community_audit('COMMUNITY_MODERATED', 'community', p_id::text, p_status || ' — ' || left(coalesce(p_note, ''), 180));
end;
$$;

create or replace function public.set_community_flags(p_id uuid, p_verified boolean, p_sponsored boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  update public.communities
  set verified = coalesce(p_verified, false),
      is_sponsored = coalesce(p_sponsored, false),
      updated_at = now()
  where id = p_id;
  if not found then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  perform public.community_audit('COMMUNITY_FLAGS', 'community', p_id::text, 'Vérifiée=' || p_verified::text || ', sponsorisée=' || p_sponsored::text);
end;
$$;

create or replace function public.archive_own_community(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  manager public.community_managers;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into manager from public.community_managers where user_id = auth.uid() and status = 'active';
  if not public.is_admin() and (manager.user_id is null or not manager.can_archive_own) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  update public.communities
  set status = 'archived', updated_at = now()
  where id = p_id and (owner_id = auth.uid() or public.is_admin());
  if not found then raise exception 'COMMUNITY_NOT_OWNER'; end if;
  perform public.community_audit('COMMUNITY_ARCHIVED', 'community', p_id::text, 'Fiche archivée.');
end;
$$;

create or replace function public.list_my_communities()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  if not public.is_admin() and not exists (
    select 1 from public.community_managers where user_id = auth.uid()
  ) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'cover_url', c.cover_url,
      'short_description', c.short_description, 'long_description', c.long_description,
      'platform', c.platform, 'destination_url', c.destination_url,
      'primary_category_id', c.primary_category_id, 'language', c.language,
      'country_code', c.country_code, 'organizer_name', c.organizer_name,
      'tags', c.tags, 'status', c.status, 'rejection_reason', c.rejection_reason,
      'verified', c.verified, 'is_sponsored', c.is_sponsored,
      'responsible_ack', c.responsible_ack, 'published_at', c.published_at,
      'created_at', c.created_at, 'updated_at', c.updated_at,
      'category_code', cat.code, 'category_name', cat.name, 'is_sensitive', cat.is_sensitive
    ) order by c.updated_at desc)
    from public.communities c
    join public.community_categories cat on cat.id = c.primary_category_id
    where public.is_admin() or c.owner_id = auth.uid()
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_communities_for_admin(p_status text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'owner_id', c.owner_id, 'name', c.name, 'platform', c.platform,
      'destination_url', c.destination_url, 'status', c.status,
      'rejection_reason', c.rejection_reason, 'verified', c.verified,
      'is_sponsored', c.is_sponsored, 'short_description', c.short_description,
      'language', c.language, 'updated_at', c.updated_at, 'published_at', c.published_at,
      'category_name', cat.name
    ) order by c.updated_at desc)
    from public.communities c
    join public.community_categories cat on cat.id = c.primary_category_id
    where p_status = '' or c.status = p_status
  ), '[]'::jsonb);
end;
$$;

create or replace function public.appoint_community_manager(p_email text, p_permissions jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  target_email text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if target_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'COMMUNITY_USER_NOT_FOUND'; end if;
  select id into target
  from auth.users
  where lower(email) = target_email and email_confirmed_at is not null;
  if target is null then raise exception 'COMMUNITY_USER_NOT_FOUND'; end if;
  insert into public.community_managers (
    user_id, status, can_create, can_edit_own, can_submit, can_archive_own,
    can_publish_directly, can_moderate_all, appointed_by, appointed_at, revoked_at, updated_at
  ) values (
    target,
    'active',
    coalesce((p_permissions->>'can_create')::boolean, true),
    coalesce((p_permissions->>'can_edit_own')::boolean, true),
    coalesce((p_permissions->>'can_submit')::boolean, true),
    coalesce((p_permissions->>'can_archive_own')::boolean, false),
    coalesce((p_permissions->>'can_publish_directly')::boolean, false),
    coalesce((p_permissions->>'can_moderate_all')::boolean, false),
    auth.uid(),
    now(),
    null,
    now()
  )
  on conflict (user_id) do update set
    status = 'active',
    can_create = excluded.can_create,
    can_edit_own = excluded.can_edit_own,
    can_submit = excluded.can_submit,
    can_archive_own = excluded.can_archive_own,
    can_publish_directly = excluded.can_publish_directly,
    can_moderate_all = excluded.can_moderate_all,
    appointed_by = auth.uid(),
    revoked_at = null,
    updated_at = now();
  perform public.community_audit('MANAGER_APPOINTED', 'manager', target::text, 'Responsable nommé : ' || target_email);
  return target;
end;
$$;

create or replace function public.set_community_manager_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if p_status not in ('active', 'suspended', 'revoked') then raise exception 'COMMUNITY_INVALID_STATUS'; end if;
  update public.community_managers
  set status = p_status,
      revoked_at = case when p_status = 'revoked' then now() else null end,
      updated_at = now()
  where user_id = p_user_id;
  if not found then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  perform public.community_audit('MANAGER_STATUS', 'manager', p_user_id::text, 'Statut responsable : ' || p_status);
end;
$$;

create or replace function public.update_community_manager_permissions(p_user_id uuid, p_permissions jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  update public.community_managers set
    can_create = coalesce((p_permissions->>'can_create')::boolean, can_create),
    can_edit_own = coalesce((p_permissions->>'can_edit_own')::boolean, can_edit_own),
    can_submit = coalesce((p_permissions->>'can_submit')::boolean, can_submit),
    can_archive_own = coalesce((p_permissions->>'can_archive_own')::boolean, can_archive_own),
    can_publish_directly = coalesce((p_permissions->>'can_publish_directly')::boolean, can_publish_directly),
    can_moderate_all = coalesce((p_permissions->>'can_moderate_all')::boolean, can_moderate_all),
    updated_at = now()
  where user_id = p_user_id;
  if not found then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  perform public.community_audit('MANAGER_PERMISSIONS', 'manager', p_user_id::text, 'Permissions mises à jour par le SuperAdmin.');
end;
$$;

create or replace function public.list_community_managers()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', m.user_id,
      'email', u.email,
      'status', m.status,
      'can_create', m.can_create,
      'can_edit_own', m.can_edit_own,
      'can_submit', m.can_submit,
      'can_archive_own', m.can_archive_own,
      'can_publish_directly', m.can_publish_directly,
      'can_moderate_all', m.can_moderate_all,
      'appointed_at', m.appointed_at,
      'revoked_at', m.revoked_at
    ) order by m.appointed_at desc)
    from public.community_managers m
    join auth.users u on u.id = m.user_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.upsert_community_category(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid := nullif(p_payload->>'id', '')::uuid;
  code text := lower(regexp_replace(coalesce(p_payload->>'code', p_payload->>'name', 'autre'), '[^a-z0-9]+', '-', 'g'));
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if length(btrim(coalesce(p_payload->>'name', ''))) < 2 then raise exception 'COMMUNITY_INVALID_NAME'; end if;
  if cid is null then
    insert into public.community_categories (code, name, description, icon, sort_order, color, is_active, is_sensitive)
    values (
      left(code, 40),
      left(btrim(p_payload->>'name'), 120),
      left(coalesce(p_payload->>'description', ''), 300),
      left(coalesce(p_payload->>'icon', 'users'), 40),
      coalesce((p_payload->>'sort_order')::integer, 100),
      nullif(p_payload->>'color', ''),
      coalesce((p_payload->>'is_active')::boolean, true),
      coalesce((p_payload->>'is_sensitive')::boolean, false)
    ) returning id into cid;
  else
    update public.community_categories set
      name = left(btrim(p_payload->>'name'), 120),
      description = left(coalesce(p_payload->>'description', description), 300),
      icon = left(coalesce(p_payload->>'icon', icon), 40),
      sort_order = coalesce((p_payload->>'sort_order')::integer, sort_order),
      color = coalesce(nullif(p_payload->>'color', ''), color),
      is_active = coalesce((p_payload->>'is_active')::boolean, is_active),
      is_sensitive = coalesce((p_payload->>'is_sensitive')::boolean, is_sensitive),
      updated_at = now()
    where id = cid;
  end if;
  perform public.community_audit('CATEGORY_SAVED', 'category', cid::text, left(btrim(p_payload->>'name'), 120));
  return cid;
end;
$$;

create or replace function public.set_community_policy(
  p_require_approval boolean,
  p_revalidate boolean,
  p_extra_hosts text[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text[];
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  select coalesce(array_agg(lower(item)), '{}') into cleaned
  from unnest(coalesce(p_extra_hosts, '{}')) item
  where item ~* '^[a-z0-9.-]+$' and item !~* '^(javascript|data|file)$';
  update public.community_settings
  set require_approval = coalesce(p_require_approval, true),
      revalidate_on_major_edit = coalesce(p_revalidate, true),
      extra_hosts = coalesce(cleaned, '{}'),
      updated_at = now()
  where id = 1;
  perform public.community_audit('POLICY_UPDATED', 'settings', '1', 'Règles de publication mises à jour.');
end;
$$;

create or replace function public.get_community_policy()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  row public.community_settings;
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  select * into row from public.community_settings where id = 1;
  return jsonb_build_object(
    'require_approval', row.require_approval,
    'revalidate_on_major_edit', row.revalidate_on_major_edit,
    'extra_hosts', row.extra_hosts
  );
end;
$$;

create or replace function public.report_community(p_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  reason text := btrim(coalesce(p_reason, ''));
begin
  if length(reason) < 8 or length(reason) > 500 then raise exception 'COMMUNITY_INVALID_TEXT'; end if;
  if public.contains_malicious_payload(reason) then raise exception 'COMMUNITY_UNSAFE_TEXT'; end if;
  if not exists (select 1 from public.communities where id = p_id and status = 'published') then
    raise exception 'COMMUNITY_NOT_FOUND';
  end if;
  insert into public.community_reports (community_id, reporter_id, reason)
  values (p_id, auth.uid(), reason)
  returning id into rid;
  perform public.community_audit('COMMUNITY_REPORTED', 'report', rid::text, 'Signalement reçu.');
  return rid;
end;
$$;

create or replace function public.list_community_reports()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'community_id', r.community_id, 'community_name', c.name,
      'reason', r.reason, 'status', r.status, 'decision_note', r.decision_note,
      'created_at', r.created_at
    ) order by r.created_at desc)
    from public.community_reports r
    join public.communities c on c.id = r.community_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.resolve_community_report(p_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if p_status not in ('reviewed', 'dismissed', 'actioned') then raise exception 'COMMUNITY_INVALID_STATUS'; end if;
  update public.community_reports
  set status = p_status,
      decision_note = left(btrim(coalesce(p_note, '')), 500),
      resolved_at = now()
  where id = p_id;
  if not found then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  perform public.community_audit('REPORT_RESOLVED', 'report', p_id::text, p_status);
end;
$$;

create or replace function public.list_community_audit(p_mine boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  if p_mine and not public.is_admin() and not exists (
    select 1 from public.community_managers where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  if not p_mine and not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'action', action, 'target_type', target_type,
      'target_id', target_id, 'summary', summary, 'created_at', created_at
    ) order by created_at desc)
    from (
      select * from public.community_audit_logs
      where public.is_admin() or actor_id = auth.uid()
      order by created_at desc
      limit 40
    ) recent
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.community_audit(text, text, text, text) from public, anon, authenticated;
revoke all on function public.is_safe_community_url(text) from public, anon, authenticated;
revoke all on function public.community_host_matches(text, text) from public, anon, authenticated;
revoke all on function public.active_community_manager(uuid) from public, anon, authenticated;
revoke all on function public.my_community_access() from public;
revoke all on function public.list_community_categories(boolean) from public;
revoke all on function public.list_published_communities(text, text, uuid, text, text, integer, integer) from public;
revoke all on function public.report_community(uuid, text) from public;
revoke all on function public.save_community(jsonb) from public, anon;
revoke all on function public.submit_community(uuid) from public, anon;
revoke all on function public.moderate_community(uuid, text, text) from public, anon;
revoke all on function public.set_community_flags(uuid, boolean, boolean) from public, anon;
revoke all on function public.archive_own_community(uuid) from public, anon;
revoke all on function public.list_my_communities() from public, anon;
revoke all on function public.list_communities_for_admin(text) from public, anon;
revoke all on function public.appoint_community_manager(text, jsonb) from public, anon;
revoke all on function public.set_community_manager_status(uuid, text) from public, anon;
revoke all on function public.update_community_manager_permissions(uuid, jsonb) from public, anon;
revoke all on function public.list_community_managers() from public, anon;
revoke all on function public.upsert_community_category(jsonb) from public, anon;
revoke all on function public.set_community_policy(boolean, boolean, text[]) from public, anon;
revoke all on function public.get_community_policy() from public, anon;
revoke all on function public.list_community_reports() from public, anon;
revoke all on function public.resolve_community_report(uuid, text, text) from public, anon;
revoke all on function public.list_community_audit(boolean) from public, anon;
revoke all on function public.list_moderation_queue() from public, anon;

grant execute on function public.my_community_access() to anon, authenticated;
grant execute on function public.list_community_categories(boolean) to anon, authenticated;
grant execute on function public.list_published_communities(text, text, uuid, text, text, integer, integer) to anon, authenticated;
grant execute on function public.report_community(uuid, text) to anon, authenticated;
grant execute on function public.save_community(jsonb) to authenticated;
grant execute on function public.submit_community(uuid) to authenticated;
grant execute on function public.moderate_community(uuid, text, text) to authenticated;
grant execute on function public.set_community_flags(uuid, boolean, boolean) to authenticated;
grant execute on function public.archive_own_community(uuid) to authenticated;
grant execute on function public.list_my_communities() to authenticated;
grant execute on function public.list_communities_for_admin(text) to authenticated;
grant execute on function public.appoint_community_manager(text, jsonb) to authenticated;
grant execute on function public.set_community_manager_status(uuid, text) to authenticated;
grant execute on function public.update_community_manager_permissions(uuid, jsonb) to authenticated;
grant execute on function public.list_community_managers() to authenticated;
grant execute on function public.upsert_community_category(jsonb) to authenticated;
grant execute on function public.set_community_policy(boolean, boolean, text[]) to authenticated;
grant execute on function public.get_community_policy() to authenticated;
grant execute on function public.list_community_reports() to authenticated;
grant execute on function public.resolve_community_report(uuid, text, text) to authenticated;
create or replace function public.list_moderation_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  manager public.community_managers;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into manager from public.community_managers where user_id = auth.uid() and status = 'active';
  if not public.is_admin() and not coalesce(manager.can_moderate_all, false) then
    raise exception 'COMMUNITY_FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'platform', c.platform,
      'destination_url', c.destination_url, 'status', c.status,
      'short_description', c.short_description, 'language', c.language,
      'rejection_reason', c.rejection_reason, 'responsible_ack', c.responsible_ack,
      'updated_at', c.updated_at, 'category_name', cat.name
    ) order by c.updated_at desc)
    from public.communities c
    join public.community_categories cat on cat.id = c.primary_category_id
    where c.status = 'pending'
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_moderation_queue() to authenticated;
grant execute on function public.list_community_audit(boolean) to authenticated;

revoke all on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;

insert into public.community_categories (code, name, description, icon, sort_order, color, is_sensitive)
values
  ('wellbeing', 'Bien-être psychologique et développement personnel', 'Groupes de réflexion personnelle, sans promesse de soin.', 'heart', 1, '#0F9F6E', true),
  ('listening', 'Écoute, entraide et relations humaines', 'Entraide humaine, distincte de l’écoute privée Nia-Mind.', 'ear', 2, '#7F1D3F', true),
  ('motivation', 'Motivation, citations et inspiration', 'Chaînes et pages d’élan quotidien.', 'spark', 3, '#0F9F6E', false),
  ('daily', 'Conseils sociaux et vie quotidienne', 'Repères concrets pour le quotidien.', 'users', 4, '#0F766E', false),
  ('learning', 'Guides, éducation et apprentissage', 'Apprendre à son rythme.', 'book', 5, '#0284C7', false),
  ('health', 'Santé, prévention et hygiène de vie', 'Prévention responsable, jamais un diagnostic.', 'shield', 6, '#7F1D3F', true),
  ('youth', 'Jeunesse, carrière et entrepreneuriat', 'Parcours, métiers et initiatives.', 'briefcase', 7, '#0F9F6E', false),
  ('news', 'Actualités et informations utiles', 'Informations pratiques, sans remplacer une source officielle.', 'news', 8, '#1F2937', false),
  ('culture', 'Communautés culturelles et initiatives locales', 'Cultures, quartiers et initiatives de terrain.', 'culture', 9, '#7F1D3F', false),
  ('leisure', 'Loisirs, quiz et divertissement', 'Détente et jeux, distincts du loisir du jour.', 'game', 10, '#0F9F6E', false),
  ('other', 'Autres thématiques approuvées', 'Sujets utiles validés par l’administration.', 'more', 11, '#5C6D64', false)
on conflict (code) do nothing;

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
    '/', '/conseils', '/histoires', '/ressources', '/loisir', '/a-propos',
    '/connexion', '/inscription', '/communautes'
  ) then
    return;
  end if;
  insert into public.site_traffic_daily (day, path, views)
  values ((timezone('utc', now()))::date, clean, 1)
  on conflict (day, path)
  do update set views = public.site_traffic_daily.views + 1;
end;
$$;

notify pgrst, 'reload schema';
