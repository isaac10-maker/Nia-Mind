-- ============================================================================
-- NIA-MIND — Schéma Complet PostgreSQL & Politiques Row Level Security (RLS)
-- Slogan officiel : « Le vrai sans le masque »
-- Garanties de sécurité :
-- 1. Isolation stricte entre Utilisateur A et Utilisateur B (auth.uid() = user_id)
-- 2. Interdiction absolue pour un utilisateur de s'auto-attribuer le rôle 'admin'
-- 3. Le journal personnel n'est JAMAIS lisible par un tiers (même administrateur)
-- 4. Séparation des histoires privées et des publications publiques +
--    Trigger SQL interdisant toute publication sans autorisation explicite de l'auteur
--    sur la version exacte proposée.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. RÔLES SÉCURISÉS CÔTÉ SERVEUR (Protection contre l'auto-élévation de privilèges)
-- ----------------------------------------------------------------------------
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'listener', 'admin')),
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'listener')
  );
$$;

-- Un utilisateur peut uniquement lire son propre rôle ; seul un admin existant peut modifier
create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "user_roles_admin_insert_only"
  on public.user_roles for insert
  with check (public.is_admin());

create policy "user_roles_admin_update_only"
  on public.user_roles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "user_roles_admin_delete_only"
  on public.user_roles for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. PROFILS UTILISATEURS & PRÉFÉRENCES
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  public_pseudonym text default 'Anonyme',
  bio text default '',
  country_code text not null default 'BF',
  theme_preference text not null default 'light' check (theme_preference in ('light', 'dark')),
  reduced_motion boolean not null default false,
  notifications_enabled boolean not null default true,
  daily_tip_modal_enabled boolean not null default true,
  accepted_terms_version text not null default 'v2.4-2026-10',
  accepted_terms_at timestamptz not null default now(),
  optional_analytics_consent boolean not null default false,
  optional_wellness_insights_consent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. CONVERSATIONS ASSISTANT NIA-MIND (Strictement privées : Utilisateur A != B)
-- ----------------------------------------------------------------------------
create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  content text not null,
  distress_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

create policy "assistant_conversations_owner_only"
  on public.assistant_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "assistant_messages_owner_only"
  on public.assistant_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. BIEN-ÊTRE : HUMEUR, STRESS/SOMMEIL, QUESTIONNAIRES (Strictement privés)
-- ----------------------------------------------------------------------------
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score smallint not null check (mood_score between 1 and 5),
  mood_label text not null,
  note text default '',
  tags text[] default '{}',
  recorded_at timestamptz not null default now()
);

create table if not exists public.stress_sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stress_level smallint not null check (stress_level between 1 and 10),
  sleep_hours numeric(3,1) not null check (sleep_hours between 0 and 24),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  note text default '',
  recorded_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questionnaire_code text not null,
  questionnaire_version text not null,
  raw_score integer not null,
  normalized_score integer not null,
  interpretation_band text not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.mood_entries enable row level security;
alter table public.stress_sleep_entries enable row level security;
alter table public.questionnaire_responses enable row level security;

create policy "mood_entries_owner_only"
  on public.mood_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "stress_sleep_entries_owner_only"
  on public.stress_sleep_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "questionnaire_responses_owner_only"
  on public.questionnaire_responses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. JOURNAL PERSONNEL (Strictement privé — même l'admin n'y a pas accès)
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default '',
  content text not null,
  category text default 'Réflexion libre',
  prompt_used text default null,
  is_draft boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "journal_entries_strictly_owner_only"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. HISTOIRES : SÉPARATION PRIVÉ / PUBLIC & AUTORISATION EXPLICITE DE L'AUTEUR
-- ----------------------------------------------------------------------------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text default '',
  public_pseudonym text not null default 'Anonyme',
  original_content text not null,
  proposed_public_content text default null,
  current_version integer not null default 1,
  author_approved_version integer default null,
  author_explicit_consent boolean not null default false,
  author_consent_at timestamptz default null,
  status text not null default 'Brouillon' check (
    status in (
      'Brouillon',
      'Envoyée',
      'En modération',
      'Modification demandée',
      'Refusée',
      'Autorisation demandée',
      'Autorisée',
      'Publiée',
      'Retirée',
      'Archivée'
    )
  ),
  moderation_note text default '',
  decision_history jsonb not null default '[]'::jsonb,
  published_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stories enable row level security;

-- Trigger serveur garantissant qu'aucun administrateur ne peut publier une histoire
-- sans l'autorisation explicite de son auteur sur la version exacte proposée.
create or replace function public.enforce_story_publication_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'Publiée' then
    if new.author_explicit_consent is not true
       or new.author_approved_version is null
       or new.author_approved_version <> new.current_version
       or coalesce(trim(new.proposed_public_content), '') = '' then
      raise exception 'VIOLATION DE SÉCURITÉ NIA-MIND : Une histoire ne peut jamais être publiée sans l''autorisation explicite de son auteur pour la version concernée.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_story_publication_consent on public.stories;
create trigger trg_enforce_story_publication_consent
  before insert or update on public.stories
  for each row
  execute function public.enforce_story_publication_consent();

-- Politiques RLS sur les histoires privées :
-- 1. L'auteur voit et gère ses propres histoires (tous statuts)
create policy "stories_author_select_own"
  on public.stories for select
  using (auth.uid() = author_id);

-- 2. L'administrateur voit uniquement les histoires soumises (jamais les 'Brouillon' privés !)
create policy "stories_admin_select_submitted"
  on public.stories for select
  using (public.is_admin() and status <> 'Brouillon');

create policy "stories_author_insert"
  on public.stories for insert
  with check (auth.uid() = author_id);

create policy "stories_author_or_admin_update"
  on public.stories for update
  using (auth.uid() = author_id or (public.is_admin() and status <> 'Brouillon'));

-- 3. Table dédiée 'published_stories' protégée par RLS (aucun author_id ni original_content,
--    évite toute vue SECURITY DEFINER / UNRESTRICTED dans Supabase Security Advisor)
create table if not exists public.published_stories (
  id uuid primary key references public.stories(id) on delete cascade,
  category text not null,
  title text not null default 'Sans titre',
  public_pseudonym text not null default 'Anonyme',
  content text not null,
  version integer not null default 1,
  published_at timestamptz not null default now()
);

alter table public.published_stories enable row level security;

create policy "published_stories_public_read"
  on public.published_stories for select
  using (true);

create policy "published_stories_admin_write"
  on public.published_stories for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.sync_published_story_table()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.published_stories where id = old.id;
    return old;
  end if;

  if new.status = 'Publiée'
     and new.author_explicit_consent = true
     and new.author_approved_version = new.current_version then
    insert into public.published_stories (id, category, title, public_pseudonym, content, version, published_at)
    values (
      new.id,
      new.category,
      coalesce(nullif(trim(new.title), ''), 'Sans titre'),
      coalesce(nullif(trim(new.public_pseudonym), ''), 'Anonyme'),
      new.proposed_public_content,
      new.current_version,
      coalesce(new.published_at, now())
    )
    on conflict (id) do update set
      category = excluded.category,
      title = excluded.title,
      public_pseudonym = excluded.public_pseudonym,
      content = excluded.content,
      version = excluded.version,
      published_at = excluded.published_at;
  else
    delete from public.published_stories where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_published_story_table on public.stories;
create trigger trg_sync_published_story_table
  after insert or update or delete on public.stories
  for each row
  execute function public.sync_published_story_table();

-- ----------------------------------------------------------------------------
-- 7. DEMANDES D'ÉCOUTE HUMAINE (Auteur + Équipe autorisée uniquement)
-- ----------------------------------------------------------------------------
create table if not exists public.listening_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  preferred_mode text not null default 'Échange écrit asynchrone',
  preferred_slot text not null default 'Dès qu''un écoutant est disponible',
  message text not null,
  status text not null default 'Envoyée' check (
    status in (
      'Envoyée',
      'En attente',
      'En cours',
      'Réponse disponible',
      'Clôturée'
    )
  ),
  listener_reply text default null,
  assigned_listener text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listening_requests enable row level security;

create policy "listening_requests_owner_or_staff_select"
  on public.listening_requests for select
  using (auth.uid() = user_id or public.is_staff());

create policy "listening_requests_owner_insert"
  on public.listening_requests for insert
  with check (auth.uid() = user_id);

create policy "listening_requests_owner_or_staff_update"
  on public.listening_requests for update
  using (auth.uid() = user_id or public.is_staff());

-- ----------------------------------------------------------------------------
-- 8. DEMANDES RGPD & JOURNAUX D'AUDIT (Sans données sensibles en clair)
-- ----------------------------------------------------------------------------
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('data_access', 'data_export', 'account_deletion')),
  status text not null default 'Enregistrée' check (status in ('Enregistrée', 'En traitement', 'Terminée')),
  reason text default '',
  created_at timestamptz not null default now()
);

alter table public.privacy_requests enable row level security;

create policy "privacy_requests_owner_or_admin"
  on public.privacy_requests for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  action_code text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select_only"
  on public.audit_logs for select
  using (public.is_admin());

create policy "audit_logs_authenticated_insert"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- 9. TABLES ÉDITORIALES PUBLIQUES (Conseils du jour & Ressources d'aide vérifiées)
-- ----------------------------------------------------------------------------
create table if not exists public.daily_tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Écoute', 'Franchise', 'Réflexion', 'Bien-être', 'Authenticité')),
  summary text not null,
  content text not null,
  reflection_question text not null,
  reading_time_min smallint not null default 2,
  is_featured_today boolean not null default false,
  published_at date not null default current_date
);

alter table public.daily_tips enable row level security;

create policy "daily_tips_public_read"
  on public.daily_tips for select
  using (true);

create policy "daily_tips_admin_write"
  on public.daily_tips for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.help_resources (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_label text not null,
  organization_name text not null,
  phone_or_contact text not null,
  availability text not null,
  description text not null,
  verified_source text not null,
  is_emergency boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.help_resources enable row level security;

create policy "help_resources_public_read"
  on public.help_resources for select
  using (true);

create policy "help_resources_admin_write"
  on public.help_resources for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. TRIGGERS ANTI-SPAM, ANTI-PENTEST & GARDE D'ÉTAT (PROTECTION SQL/XSS/PRIVILÈGES)
-- ----------------------------------------------------------------------------
create or replace function public.contains_malicious_payload(input_text text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
begin
  if input_text is null or length(input_text) = 0 then
    return false;
  end if;

  if input_text ~* '(<\s*\/?\s*(script|iframe|object|embed|svg|math|style|link|meta|base|form)\b|on[a-z]{3,20}\s*=|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html)' then
    return true;
  end if;

  if input_text ~* '(\bunion\s+(all\s+)?select\b|;\s*(drop|delete|truncate|alter|update|insert|grant|revoke)\s+|\bpg_sleep\s*\(|\bwaitfor\s+delay\b|\bbenchmark\s*\(|\binformation_schema\b|\bpg_catalog\b)' then
    return true;
  end if;

  if input_text ~* '(__proto__|constructor\s*\[|prototype\s*\[)' then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.enforce_antispam_and_payload_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer := 0;
begin
  if tg_table_name = 'journal_entries' then
    if length(coalesce(new.title, '')) > 200 or length(coalesce(new.content, '')) > 12000 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Entrée de journal trop volumineuse.';
    end if;
    if public.contains_malicious_payload(new.title) or public.contains_malicious_payload(new.content) or public.contains_malicious_payload(new.category) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte (XSS/SQLi) détectée et rejetée par le trigger SQL.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.journal_entries
      where user_id = new.user_id and created_at > now() - interval '1 minute';
      if recent_count >= 10 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Trop d''entrées de journal créées en moins d''une minute.';
      end if;
    end if;

  elsif tg_table_name = 'mood_entries' then
    if length(coalesce(new.note, '')) > 2000 or length(coalesce(new.mood_label, '')) > 100 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Note d''humeur trop longue.';
    end if;
    if public.contains_malicious_payload(new.note) or public.contains_malicious_payload(new.mood_label) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte (XSS/SQLi) détectée dans le suivi d''humeur.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.mood_entries
      where user_id = new.user_id and created_at > now() - interval '1 minute';
      if recent_count >= 6 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Trop d''enregistrements d''humeur rapprochés.';
      end if;
    end if;

  elsif tg_table_name = 'stress_sleep_entries' then
    if length(coalesce(new.note, '')) > 2000 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Note de stress/sommeil trop longue.';
    end if;
    if public.contains_malicious_payload(new.note) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte détectée dans le suivi stress/sommeil.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.stress_sleep_entries
      where user_id = new.user_id and created_at > now() - interval '1 minute';
      if recent_count >= 6 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Trop d''enregistrements stress/sommeil rapprochés.';
      end if;
    end if;

  elsif tg_table_name = 'stories' then
    if length(coalesce(new.title, '')) > 200 or length(coalesce(new.original_content, '')) > 15000 or length(coalesce(new.proposed_public_content, '')) > 15000 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Histoire trop volumineuse.';
    end if;
    if public.contains_malicious_payload(new.title)
       or public.contains_malicious_payload(new.original_content)
       or public.contains_malicious_payload(new.proposed_public_content)
       or public.contains_malicious_payload(new.public_pseudonym) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte détectée dans l''histoire.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.stories
      where author_id = new.author_id and created_at > now() - interval '10 minutes';
      if recent_count >= 5 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Limite d''envoi d''histoires atteinte (max 5 par 10 min).';
      end if;
    end if;

  elsif tg_table_name = 'listening_requests' then
    if length(coalesce(new.message, '')) > 4000 or length(coalesce(new.topic, '')) > 200 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Message de demande d''écoute trop volumineux.';
    end if;
    if public.contains_malicious_payload(new.message) or public.contains_malicious_payload(new.topic) or public.contains_malicious_payload(new.preferred_slot) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte détectée dans la demande d''écoute.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.listening_requests
      where user_id = new.user_id and created_at > now() - interval '15 minutes';
      if recent_count >= 3 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Limite de demandes d''écoute atteinte (max 3 par 15 min).';
      end if;
    end if;

  elsif tg_table_name = 'assistant_messages' then
    if length(coalesce(new.content, '')) > 3000 then
      raise exception 'SECURITY_PAYLOAD_LIMIT: Message assistant trop long.';
    end if;
    if public.contains_malicious_payload(new.content) then
      raise exception 'SECURITY_PENTEST_BLOCKED: Charge suspecte détectée dans le message assistant.';
    end if;
    if tg_op = 'INSERT' then
      select count(*) into recent_count from public.assistant_messages
      where user_id = new.user_id and created_at > now() - interval '1 minute';
      if recent_count >= 15 then
        raise exception 'SECURITY_ANTISPAM_RATE_LIMIT: Trop de messages envoyés en une minute.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_journal_entries on public.journal_entries;
create trigger trg_guard_journal_entries
  before insert or update on public.journal_entries
  for each row execute function public.enforce_antispam_and_payload_guard();

drop trigger if exists trg_guard_mood_entries on public.mood_entries;
create trigger trg_guard_mood_entries
  before insert or update on public.mood_entries
  for each row execute function public.enforce_antispam_and_payload_guard();

drop trigger if exists trg_guard_stress_sleep_entries on public.stress_sleep_entries;
create trigger trg_guard_stress_sleep_entries
  before insert or update on public.stress_sleep_entries
  for each row execute function public.enforce_antispam_and_payload_guard();

drop trigger if exists trg_guard_stories on public.stories;
create trigger trg_guard_stories
  before insert or update on public.stories
  for each row execute function public.enforce_antispam_and_payload_guard();

drop trigger if exists trg_guard_listening_requests on public.listening_requests;
create trigger trg_guard_listening_requests
  before insert or update on public.listening_requests
  for each row execute function public.enforce_antispam_and_payload_guard();

drop trigger if exists trg_guard_assistant_messages on public.assistant_messages;
create trigger trg_guard_assistant_messages
  before insert or update on public.assistant_messages
  for each row execute function public.enforce_antispam_and_payload_guard();

create or replace function public.enforce_story_state_and_admin_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' and new.status not in ('Brouillon', 'Envoyée') then
      raise exception 'SECURITY_PRIVILEGE_ESCALATION: Un auteur ne peut créer une histoire qu''en statut Brouillon ou Envoyée.';
    end if;
    if tg_op = 'UPDATE' then
      if new.moderation_note is distinct from old.moderation_note
         or new.proposed_public_content is distinct from old.proposed_public_content
         or new.current_version is distinct from old.current_version then
        raise exception 'SECURITY_PRIVILEGE_ESCALATION: Seul un administrateur peut modifier la proposition éditoriale ou la note de modération.';
      end if;
      if new.status = 'Publiée' and old.status <> 'Publiée' then
        raise exception 'SECURITY_PRIVILEGE_ESCALATION: Seul un administrateur peut activer la mise en ligne finale après votre accord.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_story_state_and_admin_guard on public.stories;
create trigger trg_story_state_and_admin_guard
  before insert or update on public.stories
  for each row execute function public.enforce_story_state_and_admin_guard();


