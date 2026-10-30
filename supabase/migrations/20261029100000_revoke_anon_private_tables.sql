-- Le visiteur n'a pas besoin d'un droit de table sur les données privées.
-- RLS reste la barrière principale. Ce retrait évite qu'une politique trop large
-- ouvre plus tard une porte déjà accordée.

revoke all on table public.journal_entries from anon;
revoke all on table public.mood_entries from anon;
revoke all on table public.stress_sleep_entries from anon;
revoke all on table public.questionnaire_responses from anon;
revoke all on table public.assistant_messages from anon;
revoke all on table public.assistant_conversations from anon;
revoke all on table public.listening_requests from anon;
revoke all on table public.profiles from anon;
revoke all on table public.user_roles from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.stories from anon;
