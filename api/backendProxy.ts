import { consultDurableAuthRate, sha256Hex } from './authRate.js';
import {
  AUTH_LIMIT_ERROR,
  clientIpFromHeaders,
  consumeRateLimit,
  extractEmailHint,
  fingerprint,
  isCredentialRequest,
  releaseSlot,
  sanitizeBackendPath,
  sanitizeSearch,
  tryAcquireSlot,
  type GateDecision,
} from './requestGate.js';

const FALLBACK_ORIGIN = 'https://wyiiyfjvicwwbcbswdac.supabase.co';
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 1536 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
const UPSTREAM_CONCURRENCY = 24;
const PER_IP_CONCURRENCY = 6;

const FORWARDED_HEADERS = [
  'authorization',
  'apikey',
  'content-type',
  'accept',
  'accept-profile',
  'content-profile',
  'prefer',
  'range',
  'x-client-info',
  'x-upsert',
  'cache-control',
];

export interface ProxyDeps {
  fetchImpl?: typeof fetch;
  rateFetch?: typeof fetch;
  env?: Record<string, string | undefined>;
  now?: number;
}

export function resolveSupabaseOrigin(env: Record<string, string | undefined> = process.env): string {
  const raw = env.SUPABASE_URL || env.VITE_SUPABASE_URL || FALLBACK_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) return FALLBACK_ORIGIN;
    return url.origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

function jsonResponse(status: number, error: string, extra?: { retryAfterSec?: number; decision?: GateDecision }): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff',
    'x-nia-proxy': 'bridge',
  });
  if (extra?.retryAfterSec) headers.set('retry-after', String(extra.retryAfterSec));
  if (extra?.decision) {
    headers.set('x-ratelimit-limit', String(extra.decision.limit));
    headers.set('x-ratelimit-remaining', String(extra.decision.remaining));
  }
  return new Response(JSON.stringify({ error }), { status, headers });
}

function denied(decision: GateDecision, status = 429): Response {
  return jsonResponse(status, decision.error || 'Trop de requêtes.', {
    retryAfterSec: decision.retryAfterSec,
    decision,
  });
}

async function readStreamLimited(
  body: ReadableStream<Uint8Array> | null,
  declaredLength: number,
  maxBytes: number
): Promise<Uint8Array | null | 'too-large'> {
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return 'too-large';
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return 'too-large';
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function toArrayBuffer(body: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(body.byteLength);
  new Uint8Array(copy).set(body);
  return copy;
}

function cleanHeaderValue(value: string): string | null {
  if (!value || /[\r\n\0]/.test(value) || value.length > 8000) return null;
  return value;
}

function scopeForPath(pathname: string): 'functions' | 'backend' {
  return pathname.startsWith('/functions/v1/') ? 'functions' : 'backend';
}

export function stripBridgePrefix(pathname: string): string {
  for (const prefix of ['/api/gateway', '/backend']) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || '/';
    }
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export async function proxyBackendRequest(request: Request, deps: ProxyDeps = {}): Promise<Response> {
  const url = new URL(request.url);
  const rawPath = stripBridgePrefix(url.pathname);
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'cache-control': 'private, no-store',
        allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
        'x-nia-proxy': 'bridge',
      },
    });
  }

  if (rawPath === '/health') {
    return new Response(JSON.stringify({ ok: true, bridge: 'gateway' }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, no-store',
        'x-nia-proxy': 'bridge',
      },
    });
  }

  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return jsonResponse(426, 'Le temps réel direct est désactivé. Les requêtes passent par le pont HTTP.');
  }
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(method)) {
    return jsonResponse(405, 'Méthode non autorisée.');
  }

  const pathname = sanitizeBackendPath(rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
  const search = sanitizeSearch(url.search);
  if (!pathname || search === null) {
    return jsonResponse(400, 'Chemin de requête refusé par le pont.');
  }

  const body =
    method === 'GET' || method === 'HEAD'
      ? null
      : await readStreamLimited(
          request.body,
          Number(request.headers.get('content-length') || '0'),
          MAX_BODY_BYTES
        );
  if (body === 'too-large') return jsonResponse(413, 'Requête trop volumineuse.');

  const ip = clientIpFromHeaders(request.headers);
  const now = deps.now ?? Date.now();
  const instance = consumeRateLimit('all', 'instance', now);
  if (!instance.allowed) return denied(instance, 503);

  if (isCredentialRequest(pathname, method, search)) {
    const email = extractEmailHint(body, search);
    const rateFetch = deps.rateFetch || (deps.fetchImpl ? undefined : fetch);
    const apiKey = cleanHeaderValue(request.headers.get('apikey') || '');
    const durable = rateFetch && apiKey
      ? await consultDurableAuthRate(
          rateFetch,
          resolveSupabaseOrigin(deps.env),
          apiKey,
          email
            ? [`id:${sha256Hex(email)}`, `ip:${sha256Hex(ip || 'anonymous')}`]
            : [`id:${sha256Hex(`ip:${ip || 'anonymous'}`)}`]
        )
      : null;
    if (durable && !durable.allowed) {
      return denied({
        allowed: false,
        retryAfterSec: durable.retryAfterSec,
        limit: 3,
        remaining: 0,
        error: AUTH_LIMIT_ERROR,
      });
    }
    if (!durable) {
      const byId = consumeRateLimit(email ? fingerprint(email) : `ip:${ip}`, 'auth-id', now);
      if (!byId.allowed) return denied(byId);
      const byIp = consumeRateLimit(ip, 'auth-ip', now);
      if (!byIp.allowed) return denied(byIp);
    }
  }

  const scoped = consumeRateLimit(ip, scopeForPath(pathname), now);
  if (!scoped.allowed) return denied(scoped);

  if (!tryAcquireSlot('upstream', UPSTREAM_CONCURRENCY)) {
    return jsonResponse(503, 'Le site est momentanément protégé contre une surcharge. Réessayez dans quelques secondes.', {
      retryAfterSec: 2,
    });
  }
  if (!tryAcquireSlot(`ip:${ip}`, PER_IP_CONCURRENCY)) {
    releaseSlot('upstream');
    return jsonResponse(429, 'Trop de requêtes. Le site limite le débit pour rester disponible. Réessayez dans quelques secondes.', {
      retryAfterSec: 2,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const origin = resolveSupabaseOrigin(deps.env);
    const target = `${origin}${pathname}${search}`;
    const headers = new Headers();
    for (const name of FORWARDED_HEADERS) {
      const value = cleanHeaderValue(request.headers.get(name) || '');
      if (value) headers.set(name, value);
    }
    const fetchImpl = deps.fetchImpl || fetch;
    const upstream = await fetchImpl(target, {
      method,
      headers,
      body: body && method !== 'GET' && method !== 'HEAD' ? new Blob([toArrayBuffer(body)]) : undefined,
      redirect: 'manual',
      signal: controller.signal,
    });

    const responseBody = await readStreamLimited(
      upstream.body,
      Number(upstream.headers.get('content-length') || '0'),
      MAX_RESPONSE_BYTES
    );
    if (responseBody === 'too-large') {
      return jsonResponse(502, 'La réponse du backend dépasse la taille autorisée par le pont.');
    }

    const responseHeaders = new Headers({
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'x-nia-proxy': 'bridge',
      'x-ratelimit-limit': String(scoped.limit),
      'x-ratelimit-remaining': String(scoped.remaining),
    });
    const contentType = upstream.headers.get('content-type');
    if (contentType && !/[\r\n]/.test(contentType)) responseHeaders.set('content-type', contentType);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange && !/[\r\n]/.test(contentRange)) responseHeaders.set('content-range', contentRange);

    return new Response(responseBody ? new Uint8Array(responseBody) : null, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return jsonResponse(502, 'Le pont vers le backend est indisponible pour le moment.');
  } finally {
    clearTimeout(timer);
    releaseSlot('upstream');
    releaseSlot(`ip:${ip}`);
  }
}
