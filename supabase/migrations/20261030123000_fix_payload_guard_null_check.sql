-- Un texte Postgres ne peut pas contenir un caractère nul.
-- L'ancien test construisait ce caractère et faisait échouer chaque enregistrement.
-- Les autres motifs suspects restent en place.

create or replace function public.contains_malicious_payload(input_text text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  normalized text;
begin
  if input_text is null or length(input_text) = 0 then
    return false;
  end if;

  normalized := lower(input_text);

  if normalized ~ '(<script|javascript:|data:text/html|vbscript:|onerror\s*=|onload\s*=|onmouseover\s*=|<iframe|<object|<embed|<svg[^>]*onload|union\s+all\s+select|union\s+select|drop\s+table|alter\s+table\s+public|;\s*delete\s+from|''\s*or\s*''1''\s*=\s*''1)' then
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.contains_malicious_payload(text) from public, anon, authenticated;
