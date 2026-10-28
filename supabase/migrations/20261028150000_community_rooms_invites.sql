-- Espace de discussion Nia-Mind, invitations et publications programmées.
-- Distinct des conversations WhatsApp ou Meta. Aucun compte n'est créé par un lien.

alter table public.communities
  add column if not exists discussion_open boolean not null default false;

create table if not exists public.community_invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  token text not null unique,
  created_by uuid not null,
  expires_at timestamptz not null,
  max_uses integer not null default 40 check (max_uses between 1 and 500),
  use_count integer not null default 0,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'left', 'removed')),
  joined_via uuid,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid,
  body text not null,
  kind text not null check (kind in ('member', 'admin', 'agent_welcome', 'scheduled')),
  image_svg text,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  scheduled_post_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.community_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  poster_kind text not null default 'motivation' check (poster_kind in ('proverb', 'advice', 'motivation', 'none')),
  welcome_hint text,
  publish_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'published', 'cancelled')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_messages_room_idx on public.community_messages (community_id, created_at desc);
create index if not exists community_scheduled_due_idx on public.community_scheduled_posts (status, publish_at);

alter table public.community_invites enable row level security;
alter table public.community_invites force row level security;
alter table public.community_members enable row level security;
alter table public.community_members force row level security;
alter table public.community_messages enable row level security;
alter table public.community_messages force row level security;
alter table public.community_scheduled_posts enable row level security;
alter table public.community_scheduled_posts force row level security;

revoke all on table public.community_invites from public, anon, authenticated;
revoke all on table public.community_members from public, anon, authenticated;
revoke all on table public.community_messages from public, anon, authenticated;
revoke all on table public.community_scheduled_posts from public, anon, authenticated;

drop policy if exists community_invites_deny on public.community_invites;
create policy community_invites_deny on public.community_invites for all using (false);
drop policy if exists community_members_deny on public.community_members;
create policy community_members_deny on public.community_members for all using (false);
drop policy if exists community_messages_deny on public.community_messages;
create policy community_messages_deny on public.community_messages for all using (false);
drop policy if exists community_scheduled_deny on public.community_scheduled_posts;
create policy community_scheduled_deny on public.community_scheduled_posts for all using (false);

create or replace function public.community_escape_xml(raw text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(coalesce(raw, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

create or replace function public.community_actor_can_manage(p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  manager public.community_managers;
begin
  if auth.uid() is null then return false; end if;
  if public.is_admin() then return true; end if;
  select * into manager from public.community_managers where user_id = auth.uid() and status = 'active';
  if manager.user_id is null then return false; end if;
  if coalesce(manager.can_moderate_all, false) then return true; end if;
  return exists (
    select 1 from public.communities
    where id = p_id and owner_id = auth.uid()
  );
end;
$$;

create or replace function public.community_actor_is_member(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.community_poster_svg(p_text text, p_kind text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  clean text := left(btrim(coalesce(p_text, '')), 160);
  title text := case p_kind when 'proverb' then 'Proverbe' when 'advice' then 'Conseil' when 'motivation' then 'Motivation' else 'Message' end;
  line text;
  y integer := 280;
  svg text := '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#0F9F6E"/><rect x="54" y="54" width="972" height="972" rx="42" fill="#FFFDF8"/>';
begin
  svg := svg || '<text x="96" y="170" fill="#7F1D3F" font-size="40" font-family="Georgia,serif">' || public.community_escape_xml(title) || '</text>';
  while length(clean) > 0 and y < 900 loop
    line := left(clean, 34);
    svg := svg || '<text x="96" y="' || y || '" fill="#16352B" font-size="40" font-family="Georgia,serif">' || public.community_escape_xml(line) || '</text>';
    clean := substring(clean from 35);
    y := y + 58;
  end loop;
  svg := svg || '<text x="96" y="980" fill="#0F9F6E" font-size="28" font-family="Georgia,serif">Nia-Mind · Écouter • Comprendre • Avancer</text></svg>';
  return svg;
end;
$$;

create or replace function public.community_welcome_text(p_language text, p_name text, p_when timestamptz)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  stamp text := to_char(p_when at time zone 'utc', 'YYYY-MM-DD HH24:MI') || ' UTC';
  label text := left(coalesce(p_name, 'cette communauté'), 80);
begin
  if p_language = 'en' then
    return 'Hello. The welcome agent is publishing the message planned for ' || stamp || ' in ' || label || '. This space is not the external group, and it does not replace a qualified professional.';
  elsif p_language = 'es' then
    return 'Hola. El agente de acogida publica el mensaje previsto para ' || stamp || ' en ' || label || '. Este espacio no es el grupo externo y no sustituye a un profesional cualificado.';
  elsif p_language = 'de' then
    return 'Guten Tag. Der Empfangsagent veröffentlicht die für ' || stamp || ' vorgesehene Nachricht in ' || label || '. Dieser Raum ist nicht die externe Gruppe und ersetzt keine Fachperson.';
  elsif p_language = 'zh' then
    return '你好。接待助手正在发布预定于 ' || stamp || ' 的消息，属于「' || label || '」。这里不是外部群组，也不能代替合格的专业人士。';
  end if;
  return 'Bonjour. L’agent d’accueil publie le message prévu pour ' || stamp || ' dans ' || label || '. Cet espace n’est pas le groupe externe et ne remplace pas un professionnel qualifié.';
end;
$$;

create or replace function public.release_due_community_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.community_scheduled_posts;
  room public.communities;
  published_count integer := 0;
  welcome text;
  poster text;
begin
  for item in
    select * from public.community_scheduled_posts
    where status = 'scheduled' and publish_at <= now()
    order by publish_at
    for update skip locked
  loop
    select * into room from public.communities where id = item.community_id;
    if room.id is null then
      update public.community_scheduled_posts set status = 'cancelled' where id = item.id;
      continue;
    end if;
    welcome := public.community_welcome_text(room.language, room.name, item.publish_at);
    poster := case when item.poster_kind = 'none' then null else public.community_poster_svg(item.body, item.poster_kind) end;
    insert into public.community_messages (community_id, author_id, body, kind, image_svg, scheduled_post_id)
    values (item.community_id, null, welcome, 'agent_welcome', poster, item.id);
    insert into public.community_messages (community_id, author_id, body, kind, scheduled_post_id)
    values (item.community_id, item.author_id, item.body, 'scheduled', item.id);
    update public.community_scheduled_posts
    set status = 'published', published_at = now()
    where id = item.id;
    published_count := published_count + 1;
  end loop;
  return published_count;
end;
$$;

create or replace function public.set_community_discussion(p_id uuid, p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.community_actor_can_manage(p_id) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  update public.communities set discussion_open = coalesce(p_open, false), updated_at = now() where id = p_id;
  if not found then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  perform public.community_audit('DISCUSSION_POLICY', 'community', p_id::text, case when p_open then 'Discussion ouverte aux participants.' else 'Discussion réservée aux responsables.' end);
end;
$$;

create or replace function public.create_community_invite(p_id uuid, p_hours integer, p_max_uses integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  token text;
begin
  if not public.community_actor_can_manage(p_id) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if not exists (select 1 from public.communities where id = p_id) then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  token := replace(gen_random_uuid()::text, '-', '');
  insert into public.community_invites (community_id, token, created_by, expires_at, max_uses)
  values (
    p_id,
    token,
    auth.uid(),
    now() + make_interval(hours => least(greatest(coalesce(p_hours, 72), 1), 720)),
    least(greatest(coalesce(p_max_uses, 40), 1), 500)
  );
  perform public.community_audit('INVITE_CREATED', 'invite', p_id::text, 'Lien d’invitation créé. Aucun compte n’est ouvert.');
  return token;
end;
$$;

create or replace function public.revoke_community_invite(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  room uuid;
begin
  select community_id into room from public.community_invites where id = p_invite;
  if room is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  if not public.community_actor_can_manage(room) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  update public.community_invites set revoked = true where id = p_invite;
  perform public.community_audit('INVITE_REVOKED', 'invite', p_invite::text, 'Lien d’invitation révoqué.');
end;
$$;

create or replace function public.accept_community_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.community_invites;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  if coalesce(p_token, '') !~ '^[a-f0-9]{32}$' then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  select * into invite from public.community_invites where token = p_token;
  if invite.id is null or invite.revoked or invite.expires_at < now() or invite.use_count >= invite.max_uses then
    raise exception 'COMMUNITY_INVITE_INVALID';
  end if;
  insert into public.community_members (community_id, user_id, joined_via, status)
  values (invite.community_id, auth.uid(), invite.id, 'active')
  on conflict (community_id, user_id) do update set status = 'active', joined_via = excluded.joined_via, joined_at = now();
  update public.community_invites set use_count = use_count + 1 where id = invite.id;
  perform public.community_audit('INVITE_ACCEPTED', 'member', invite.community_id::text, 'Participation à l’espace, sans droit d’administration.');
  return invite.community_id;
end;
$$;

create or replace function public.post_community_message(p_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.communities;
  body text := btrim(coalesce(p_body, ''));
  mid uuid;
  manager boolean;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  select * into room from public.communities where id = p_id;
  if room.id is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  manager := public.community_actor_can_manage(p_id);
  if not manager and not public.community_actor_is_member(p_id) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if not manager and not room.discussion_open then raise exception 'COMMUNITY_DISCUSSION_CLOSED'; end if;
  if length(body) < 1 or length(body) > 800 then raise exception 'COMMUNITY_INVALID_TEXT'; end if;
  if public.contains_malicious_payload(body) then raise exception 'COMMUNITY_UNSAFE_TEXT'; end if;
  insert into public.community_messages (community_id, author_id, body, kind)
  values (p_id, auth.uid(), body, case when manager then 'admin' else 'member' end)
  returning id into mid;
  return mid;
end;
$$;

create or replace function public.hide_community_message(p_message uuid, p_hide boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  room uuid;
begin
  select community_id into room from public.community_messages where id = p_message;
  if room is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  if not public.community_actor_can_manage(room) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  update public.community_messages set status = case when p_hide then 'hidden' else 'visible' end where id = p_message;
  perform public.community_audit('MESSAGE_MODERATED', 'message', p_message::text, case when p_hide then 'Message masqué.' else 'Message rétabli.' end);
end;
$$;

create or replace function public.schedule_community_post(
  p_id uuid,
  p_body text,
  p_publish_at timestamptz,
  p_kind text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  body text := btrim(coalesce(p_body, ''));
  kind text := coalesce(p_kind, 'motivation');
  sid uuid;
begin
  if not public.community_actor_can_manage(p_id) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if length(body) < 2 or length(body) > 500 then raise exception 'COMMUNITY_INVALID_TEXT'; end if;
  if public.contains_malicious_payload(body) then raise exception 'COMMUNITY_UNSAFE_TEXT'; end if;
  if p_publish_at is null or p_publish_at > now() + interval '90 days' then raise exception 'COMMUNITY_INVALID_TEXT'; end if;
  if kind not in ('proverb', 'advice', 'motivation', 'none') then kind := 'motivation'; end if;
  insert into public.community_scheduled_posts (community_id, author_id, body, poster_kind, publish_at)
  values (p_id, auth.uid(), body, kind, p_publish_at)
  returning id into sid;
  perform public.community_audit('POST_SCHEDULED', 'schedule', sid::text, 'Publication confiée à l’agent d’accueil.');
  perform public.release_due_community_posts();
  return sid;
end;
$$;

create or replace function public.generate_community_poster(p_id uuid, p_text text, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  body text := btrim(coalesce(p_text, ''));
begin
  if not public.community_actor_can_manage(p_id) then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  if length(body) < 2 or length(body) > 160 then raise exception 'COMMUNITY_INVALID_TEXT'; end if;
  if public.contains_malicious_payload(body) then raise exception 'COMMUNITY_UNSAFE_TEXT'; end if;
  perform public.community_audit('POSTER_GENERATED', 'poster', p_id::text, 'Affiche générée pour un responsable.');
  return public.community_poster_svg(body, coalesce(p_kind, 'motivation'));
end;
$$;

create or replace function public.get_community_room(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room public.communities;
  manager boolean;
  member boolean;
begin
  if auth.uid() is null then raise exception 'COMMUNITY_NOT_AUTHENTICATED'; end if;
  perform public.release_due_community_posts();
  select * into room from public.communities where id = p_id;
  if room.id is null then raise exception 'COMMUNITY_NOT_FOUND'; end if;
  manager := public.community_actor_can_manage(p_id);
  member := public.community_actor_is_member(p_id);
  if not manager and not member then raise exception 'COMMUNITY_FORBIDDEN'; end if;
  return jsonb_build_object(
    'id', room.id,
    'name', room.name,
    'status', room.status,
    'language', room.language,
    'discussion_open', room.discussion_open,
    'can_manage', manager,
    'can_post', manager or (member and room.discussion_open),
    'is_member', member,
    'participants', (
      select count(*) from public.community_members
      where community_id = p_id and status = 'active'
    ),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'body', m.body, 'kind', m.kind, 'status', m.status,
        'image_svg', case when manager or m.status = 'visible' then m.image_svg else null end,
        'created_at', m.created_at
      ) order by m.created_at)
      from (
        select * from public.community_messages
        where community_id = p_id and (status = 'visible' or manager)
        order by created_at desc
        limit 80
      ) m
    ), '[]'::jsonb),
    'scheduled', case when manager then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'body', s.body, 'poster_kind', s.poster_kind,
        'publish_at', s.publish_at, 'status', s.status
      ) order by s.publish_at)
      from public.community_scheduled_posts s
      where s.community_id = p_id and s.status = 'scheduled'
    ), '[]'::jsonb) else '[]'::jsonb end,
    'invites', case when manager then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'token', i.token, 'expires_at', i.expires_at,
        'max_uses', i.max_uses, 'use_count', i.use_count, 'revoked', i.revoked
      ) order by i.created_at desc)
      from public.community_invites i
      where i.community_id = p_id
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.community_escape_xml(text) from public, anon, authenticated;
revoke all on function public.community_actor_can_manage(uuid) from public, anon, authenticated;
revoke all on function public.community_actor_is_member(uuid) from public, anon, authenticated;
revoke all on function public.community_poster_svg(text, text) from public, anon, authenticated;
revoke all on function public.community_welcome_text(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_due_community_posts() from public;
grant execute on function public.release_due_community_posts() to anon, authenticated;
revoke all on function public.set_community_discussion(uuid, boolean) from public, anon;
revoke all on function public.create_community_invite(uuid, integer, integer) from public, anon;
revoke all on function public.revoke_community_invite(uuid) from public, anon;
revoke all on function public.accept_community_invite(text) from public, anon;
revoke all on function public.post_community_message(uuid, text) from public, anon;
revoke all on function public.hide_community_message(uuid, boolean) from public, anon;
revoke all on function public.schedule_community_post(uuid, text, timestamptz, text) from public, anon;
revoke all on function public.generate_community_poster(uuid, text, text) from public, anon;
revoke all on function public.get_community_room(uuid) from public, anon;

grant execute on function public.set_community_discussion(uuid, boolean) to authenticated;
grant execute on function public.create_community_invite(uuid, integer, integer) to authenticated;
grant execute on function public.revoke_community_invite(uuid) to authenticated;
grant execute on function public.accept_community_invite(text) to authenticated;
grant execute on function public.post_community_message(uuid, text) to authenticated;
grant execute on function public.hide_community_message(uuid, boolean) to authenticated;
grant execute on function public.schedule_community_post(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.generate_community_poster(uuid, text, text) to authenticated;
grant execute on function public.get_community_room(uuid) to authenticated;

notify pgrst, 'reload schema';
