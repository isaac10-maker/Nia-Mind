/**
 * Filtre les notes préparées hors ligne avant toute reprise.
 * Aucun script, aucune balise et aucun champ inattendu ne passe.
 */

const KINDS = ['journal_note', 'mood_mark', 'leisure_note'] as const;
export type OfflineKind = (typeof KINDS)[number];

export interface CleanOfflineNote {
  kind: OfflineKind;
  title: string;
  text: string;
  tag: string;
}

const BLOCKED = /<\s*\/?\s*(script|iframe|object|embed|link|meta|svg|math)|javascript\s*:|data\s*:\s*text\/html|on[a-z]+\s*=|<\?php|eval\s*\(|new\s+Function|import\s*\(|\\u0000|\x00/i;

function plain(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\0/g, '').trim();
  if (!text || text.length > max || BLOCKED.test(text)) return null;
  return text;
}

export function filterOfflineNote(raw: unknown): CleanOfflineNote | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const allowed = new Set(['kind', 'title', 'text', 'tag']);
  if (Object.keys(source).some((key) => !allowed.has(key))) return null;
  if (typeof source.kind !== 'string' || !KINDS.includes(source.kind as OfflineKind)) return null;
  const title = plain(source.title, 80);
  const text = plain(source.text, 1500);
  const tag = plain(source.tag, 40);
  if (!title || !text || !tag) return null;
  return { kind: source.kind as OfflineKind, title, text, tag };
}
