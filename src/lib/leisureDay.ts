/**
 * Lot de loisir partagé, valable 24 h.
 * La réponse ne sort jamais de cette couche avant les 15 secondes de réflexion.
 * Aucun journal, aucun compte, aucune autre clé du site.
 */

export const REFLECT_MS = 15_000;
export const LOCK_MS = 24 * 60 * 60 * 1000;
export const QUIZ_SIZE = 5;
export const RIDDLE_FACT_SIZE = 3;
export const STORAGE_KEY = 'nia-leisure-day-v2';
export const CHOICE_COUNT = 3;

export type LeisureLanguage = 'fr' | 'en' | 'es' | 'de' | 'zh';
export type LeisureKind = 'quiz' | 'riddle';

export interface BankQuiz {
  id: string;
  topic: string;
  prompt: Record<LeisureLanguage, string>;
  choices: Record<LeisureLanguage, string[]>;
}

export interface BankRiddle {
  id: string;
  topic: string;
  prompt: Record<LeisureLanguage, string>;
  choices: Record<LeisureLanguage, string[]>;
}

export interface LeisureBank {
  version: 1;
  quiz: BankQuiz[];
  riddle: BankRiddle[];
}

export interface PublicQuiz {
  id: string;
  kind: 'quiz';
  topic: string;
  prompt: string;
  choices: string[];
}

export interface PublicRiddle {
  id: string;
  kind: 'riddle';
  topic: string;
  prompt: string;
  choices: string[];
}

export type PublicItem = PublicQuiz | PublicRiddle;

export interface LeisureBoard {
  v: 2;
  quiz: LeisureProgress | null;
  riddle: LeisureProgress | null;
}

export interface LeisureProgress {
  v: 1;
  lotId: string;
  revealed: string[];
  guesses: Record<string, number>;
  completedAt: number | null;
  unlockAt: number | null;
  score: number | null;
  total: number | null;
}

const ID_RE = /^[a-z0-9-]{1,80}$/i;
const LOT_RE = /^(quiz|riddle):\d{4}-\d{2}-\d{2}$/;

export function dayIndex(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function lotIdFor(ms: number, kind: LeisureKind): string {
  return `${kind}:${dayKey(ms)}`;
}

export function canReveal(elapsedMs: number): boolean {
  return Number.isFinite(elapsedMs) && elapsedMs >= REFLECT_MS;
}

export function unlockMoment(completedAt: number): number {
  return completedAt + LOCK_MS;
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function offsetFromDateHeader(header: string | null, localNow: number): number {
  if (!header) return 0;
  const parsed = Date.parse(header);
  if (!Number.isFinite(parsed)) return 0;
  return parsed - localNow;
}

function sliceCycle<T>(pool: T[], occurrence: number, size: number): T[] {
  if (pool.length < size) return [];
  const usable = pool.length - (pool.length % size);
  const start = (occurrence * size) % usable;
  return pool.slice(start, start + size);
}

function asLanguage(value: string): LeisureLanguage {
  if (value === 'en' || value === 'es' || value === 'de' || value === 'zh') return value;
  return 'fr';
}

function toPublic(
  item: { id: string; topic: string; prompt: Record<LeisureLanguage, string>; choices?: Record<LeisureLanguage, string[]> },
  kind: LeisureKind,
  lang: LeisureLanguage,
): PublicItem | null {
  const choices = item.choices?.[lang]?.slice(0, CHOICE_COUNT) ?? [];
  if (!item.prompt[lang] || choices.length !== CHOICE_COUNT || new Set(choices).size !== CHOICE_COUNT) return null;
  return { id: item.id, kind, topic: item.topic, prompt: item.prompt[lang], choices };
}

export function dailyLot(bank: LeisureBank, ms: number, language: string, kind: LeisureKind): PublicItem[] {
  const lang = asLanguage(language);
  const occurrence = dayIndex(ms);
  if (kind === 'quiz') {
    return sliceCycle(bank.quiz, occurrence, QUIZ_SIZE).flatMap((item) => {
      const row = toPublic(item, 'quiz', lang);
      return row ? [row] : [];
    });
  }
  const facts = bank.riddle.filter((item) => !item.id.startsWith('classic-'));
  const classics = bank.riddle.filter((item) => item.id.startsWith('classic-'));
  const classic = classics[occurrence % Math.max(classics.length, 1)];
  const picked = sliceCycle(facts, occurrence, RIDDLE_FACT_SIZE);
  return (classic ? [classic, ...picked] : picked).flatMap((item) => {
    const row = toPublic(item, 'riddle', lang);
    return row ? [row] : [];
  });
}

export function isLocked(progress: LeisureProgress | null, now: number): boolean {
  return Boolean(progress?.unlockAt && progress.completedAt != null && now < progress.unlockAt);
}

export function sanitizeProgress(raw: unknown, now: number): LeisureProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  if (source.v !== 1) return null;
  if (typeof source.lotId !== 'string' || !LOT_RE.test(source.lotId)) return null;
  if (!Array.isArray(source.revealed) || source.revealed.length > 20) return null;
  if (source.revealed.some((id) => typeof id !== 'string' || !ID_RE.test(id))) return null;
  const guesses: Record<string, number> = {};
  if (source.guesses && typeof source.guesses === 'object' && !Array.isArray(source.guesses)) {
    for (const [key, value] of Object.entries(source.guesses as Record<string, unknown>)) {
      if (!ID_RE.test(key)) continue;
      if (value === 0 || value === 1 || value === 2) guesses[key] = value;
    }
  }
  let completedAt: number | null = null;
  let unlockAt: number | null = null;
  if (typeof source.completedAt === 'number' && typeof source.unlockAt === 'number') {
    const span = source.unlockAt - source.completedAt;
    const freshEnough = source.completedAt <= now + 120_000 && source.completedAt >= now - 48 * 3_600_000;
    if (span === LOCK_MS && freshEnough) {
      completedAt = source.completedAt;
      unlockAt = source.unlockAt;
    }
  }
  const score = Number.isInteger(source.score) && Number(source.score) >= 0 && Number(source.score) <= 20
    ? Number(source.score)
    : null;
  const total = Number.isInteger(source.total) && Number(source.total) >= 1 && Number(source.total) <= 20
    ? Number(source.total)
    : null;
  return {
    v: 1,
    lotId: source.lotId,
    revealed: source.revealed.slice(0, 20) as string[],
    guesses,
    completedAt,
    unlockAt,
    score,
    total,
  };
}

export function emptyBoard(): LeisureBoard {
  return { v: 2, quiz: null, riddle: null };
}

export function loadBoard(now: number): LeisureBoard {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as LeisureBoard | null;
    if (!raw || raw.v !== 2) return emptyBoard();
    return {
      v: 2,
      quiz: sanitizeProgress(raw.quiz, now),
      riddle: sanitizeProgress(raw.riddle, now),
    };
  } catch {
    return emptyBoard();
  }
}

export function saveBoard(board: LeisureBoard, now: number): void {
  const clean: LeisureBoard = {
    v: 2,
    quiz: board.quiz ? sanitizeProgress(board.quiz, board.quiz.completedAt ?? now) : null,
    riddle: board.riddle ? sanitizeProgress(board.riddle, board.riddle.completedAt ?? now) : null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}

export function activeProgress(
  progress: LeisureProgress | null,
  now: number,
  kind: LeisureKind,
): LeisureProgress | null {
  if (!progress) return null;
  if (isLocked(progress, now)) return progress;
  if (progress.unlockAt && progress.completedAt != null && now >= progress.unlockAt) return null;
  if (progress.lotId !== lotIdFor(now, kind)) return null;
  return progress;
}
