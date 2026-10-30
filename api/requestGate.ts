export type GateScope = 'assistant' | 'auth-id' | 'auth-ip' | 'backend' | 'functions' | 'instance';

export interface GateDecision {
  allowed: boolean;
  retryAfterSec: number;
  limit: number;
  remaining: number;
  error?: string;
}

const LIMITS: Record<GateScope, { max: number; windowMs: number }> = {
  assistant: { max: 60, windowMs: 60_000 },
  'auth-id': { max: 3, windowMs: 15_000 },
  'auth-ip': { max: 15, windowMs: 15_000 },
  backend: { max: 120, windowMs: 10_000 },
  functions: { max: 30, windowMs: 60_000 },
  instance: { max: 400, windowMs: 10_000 },
};

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const inflight = new Map<string, number>();

export const AUTH_LIMIT_ERROR =
  'LIMITE DE SÉCURITÉ (3 essais / 15s) : trop de tentatives d’identification. Patientez avant de réessayer.';
const RATE_LIMIT_ERROR =
  'Trop de requêtes. Le site limite le débit pour rester disponible. Réessayez dans quelques secondes.';
const OVERLOAD_ERROR =
  'Le site est momentanément protégé contre une surcharge. Réessayez dans quelques secondes.';

export function resetRequestGateForTests(): void {
  buckets.clear();
  inflight.clear();
}

export function clientIpFromHeaders(headers: { get(name: string): string | null }): string {
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for'),
  ];
  for (const raw of candidates) {
    const first = raw?.split(',')[0]?.trim() || '';
    if (/^[0-9a-fA-F:.]+$/.test(first) && first.length <= 64) return first;
  }
  return 'anonymous';
}

export function normalizeClientIp(raw: string | undefined): string {
  const first = (raw || '').split(',')[0]?.trim() || 'anonymous';
  return first.slice(0, 64) || 'anonymous';
}

function messageFor(scope: GateScope): string {
  if (scope === 'auth-id' || scope === 'auth-ip') return AUTH_LIMIT_ERROR;
  if (scope === 'instance') return OVERLOAD_ERROR;
  return RATE_LIMIT_ERROR;
}

export function consumeRateLimit(key: string, scope: GateScope, now = Date.now()): GateDecision {
  const rule = LIMITS[scope];
  const bucketKey = `${scope}:${key}`;
  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + rule.windowMs };
    buckets.set(bucketKey, bucket);
  }

  if (bucket.count >= rule.max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      limit: rule.max,
      remaining: 0,
      error: messageFor(scope),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    retryAfterSec: 0,
    limit: rule.max,
    remaining: Math.max(0, rule.max - bucket.count),
  };
}

export function tryAcquireSlot(key: string, max: number): boolean {
  const current = inflight.get(key) || 0;
  if (current >= max) return false;
  inflight.set(key, current + 1);
  return true;
}

export function releaseSlot(key: string): void {
  const current = inflight.get(key) || 0;
  if (current <= 1) inflight.delete(key);
  else inflight.set(key, current - 1);
}

export function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

const ALLOWED_PREFIXES = ['/auth/v1/', '/rest/v1/', '/functions/v1/', '/storage/v1/'];

export function sanitizeBackendPath(rawPath: string): string | null {
  const withoutQuery = (rawPath || '').split('?')[0] || '/';
  let path = withoutQuery;
  try {
    path = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }
  if (
    path.includes('\\') ||
    path.includes('\0') ||
    path.includes('://') ||
    path.includes('..') ||
    path.includes('%')
  ) {
    return null;
  }
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 512) return null;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix)
  );
  return allowed ? path : null;
}

export function sanitizeSearch(search: string): string | null {
  if (!search) return '';
  const value = search.startsWith('?') ? search : `?${search}`;
  if (value.length > 8000 || /[\r\n\0]/.test(value)) return null;
  return value;
}

export function isCredentialRequest(pathname: string, method: string, search: string): boolean {
  const verb = method.toUpperCase();
  if (verb !== 'POST' && verb !== 'PUT' && verb !== 'PATCH') return false;
  if (pathname.startsWith('/auth/v1/signup')) return true;
  if (pathname.startsWith('/auth/v1/recover')) return true;
  if (pathname.startsWith('/auth/v1/otp')) return true;
  if (pathname.startsWith('/auth/v1/verify')) return true;
  if (pathname.startsWith('/auth/v1/token') && !search.includes('grant_type=refresh_token')) return true;
  return false;
}

export function extractEmailHint(body: Uint8Array | null, search: string): string {
  const fromSearch = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('email');
  if (fromSearch) return fromSearch.trim().toLowerCase().slice(0, 180);
  if (!body || body.byteLength === 0 || body.byteLength > 8000) return '';
  const text = new TextDecoder().decode(body);
  try {
    const parsed = JSON.parse(text) as { email?: unknown };
    if (typeof parsed.email === 'string') return parsed.email.trim().toLowerCase().slice(0, 180);
  } catch {
    const fromForm = new URLSearchParams(text).get('email');
    if (fromForm) return fromForm.trim().toLowerCase().slice(0, 180);
  }
  return '';
}
