import { filterOfflineNote, type CleanOfflineNote } from './offlineGuard';

const KEY = 'nia-offline-notes-v1';
const MAX_NOTES = 12;

export interface QueuedNote extends CleanOfflineNote {
  id: string;
  createdAt: string;
}

function readAll(): QueuedNote[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const clean = filterOfflineNote(row);
        const id = typeof row.id === 'string' ? row.id.slice(0, 40) : '';
        const createdAt = typeof row.createdAt === 'string' ? row.createdAt.slice(0, 40) : '';
        if (!clean || !/^[a-z0-9-]{8,40}$/i.test(id) || !createdAt) return null;
        return { ...clean, id, createdAt };
      })
      .filter((item): item is QueuedNote => Boolean(item))
      .slice(0, MAX_NOTES);
  } catch {
    return [];
  }
}

function writeAll(notes: QueuedNote[]): void {
  localStorage.setItem(KEY, JSON.stringify(notes.slice(0, MAX_NOTES)));
}

export function listOfflineNotes(): QueuedNote[] {
  return readAll();
}

export function queueOfflineNote(raw: unknown): { ok: true } | { ok: false; reason: string } {
  const clean = filterOfflineNote(raw);
  if (!clean) return { ok: false, reason: 'Note refusée par le filtre de sécurité.' };
  const notes = readAll();
  if (notes.length >= MAX_NOTES) return { ok: false, reason: 'File hors ligne pleine. Reconnecte-toi pour la vider.' };
  notes.push({
    ...clean,
    id: `off-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  writeAll(notes);
  window.dispatchEvent(new Event('nia-offline-queue'));
  return { ok: true };
}

export function removeOfflineNote(id: string): void {
  writeAll(readAll().filter((note) => note.id !== id));
  window.dispatchEvent(new Event('nia-offline-queue'));
}
