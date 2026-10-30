-- Limite d'identification durable, champs d'écoute réservés à l'équipe,
-- et compteur de visites qui n'augmente plus à chaque appel.

create table if not exists public.auth_rate_buckets (
  bucket_key text primary key,
  attempts integer not null,
  reset_at timestamptz not null
);

alter table public.auth_rate_buckets enable row level security;
alter table public.auth_rate_buckets force row level security;
revoke all on table public.auth_rate_buckets from public, anon, authenticated;

create table if not exists public.site_traffic_visitors (
  day date not null,
  path text not null,
  visitor_hash text not null,
  primary key (day, path, visitor_hash)
);

alter table public.site_traffic_visitors enable row level security;
alter table public.site_traffic_visitors force row level security;
revoke all on table public.site_traffic_visitors from public, anon, authenticated;

create or replace function public.consume_auth_rate(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  current_attempts integer;
  current_reset timestamptz;
  max_attempts integer;
begin
  if p_key is null or p_key !~ '^(id|ip):[a-f0-9]{64}$' then
    return jsonb_build_object('allowed', false, 'retry_after_sec', 15);
  end if;

  max_attempts := case when left(p_key, 3) = 'id:' then 3 else 15 end;

  insert into public.auth_rate_buckets (bucket_key, attempts, reset_at)
  values (p_key, 1, now_ts + interval '15 seconds')
  on conflict (bucket_key) do update
    set attempts = case
          when public.auth_rate_buckets.reset_at <= now_ts then 1
          else public.auth_rate_buckets.attempts + 1
        end,
        reset_at = case
          when public.auth_rate_buckets.reset_at <= now_ts then now_ts + interval '15 seconds'
          else public.auth_rate_buckets.reset_at
        end
  returning attempts, reset_at into current_attempts, current_reset;

  delete from public.auth_rate_buckets
  where bucket_key in (
    select stale.bucket_key
    from public.auth_rate_buckets as stale
    where stale.reset_at < now_ts - interval '1 hour'
    limit 30
  );

  if current_attempts > max_attempts then
    return jsonb_build_object(
      'allowed', false,
      'retry_after_sec', greatest(1, ceil(extract(epoch from (current_reset - now_ts)))::int)
    );
  end if;

  return jsonb_build_object('allowed', true, 'retry_after_sec', 0);
end;
$$;

revoke all on function public.consume_auth_rate(text) from public;
grant execute on function public.consume_auth_rate(text) to anon, authenticated;

create or replace function public.protect_listening_staff_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'Envoyée';
    new.listener_reply := null;
    new.assigned_listener := null;
    return new;
  end if;
  new.status := old.status;
  new.listener_reply := old.listener_reply;
  new.assigned_listener := old.assigned_listener;
  return new;
end;
$$;

revoke all on function public.protect_listening_staff_fields() from public, anon, authenticated;

drop trigger if exists trg_protect_listening_staff_fields on public.listening_requests;
create trigger trg_protect_listening_staff_fields
  before insert or update on public.listening_requests
  for each row
  execute function public.protect_listening_staff_fields();

create or replace function public.record_page_view(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text;
  headers json;
  client_ip text;
  visitor_hash text;
  day_key date := (timezone('utc', now()))::date;
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
    '/inscription',
    '/communautes'
  ) then
    return;
  end if;

  begin
    headers := current_setting('request.headers', true)::json;
  exception when others then
    return;
  end;
  client_ip := coalesce(headers->>'cf-connecting-ip', '');
  if client_ip = '' or length(client_ip) > 64 or client_ip !~ '^[0-9A-Fa-f:.]+$' then
    return;
  end if;

  visitor_hash := md5(client_ip || '|' || clean || '|' || day_key::text);
  with first_visit as (
    insert into public.site_traffic_visitors (day, path, visitor_hash)
    values (day_key, clean, visitor_hash)
    on conflict do nothing
    returning 1
  )
  insert into public.site_traffic_daily (day, path, views)
  select day_key, clean, 1
  from first_visit
  on conflict (day, path) do update
    set views = public.site_traffic_daily.views + 1;
end;
$$;

revoke all on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;

notify pgrst, 'reload schema';
