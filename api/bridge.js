// Pont same-origin autonome. Aucun import relatif : Vercel refuse
// parfois de démarrer une fonction qui en dépend, et les chemins
// imbriqués (/auth/v1, /rest/v1) ne sont pas routés hors Next.js.

const ORIGIN = 'https://wyiiyfjvicwwbcbswdac.supabase.co';
const ALLOWED = ['auth/v1/', 'rest/v1/', 'functions/v1/', 'storage/v1/'];
// Clé publique anon, pas un secret. Le build Vercel a figé une clé périmée :
// le pont la remplace, sinon Auth répond 401 et la console se remplit d'erreurs.
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aWl5Zmp2aWN3d2JjYnN3ZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDUzOTYsImV4cCI6MjEwODI4MTM5Nn0.eNQZagTUKFzGHMEXHkDV13B8fsNm9ImbjrLZ09eoabA';
const buckets = new Map();

function header(req, name) {
  const value = req.headers?.[name] || req.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

export function jwtClaims(token) {
  const part = String(token || '').split('.')[1];
  if (!part) return null;
  try {
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const claims = JSON.parse(json);
    return claims && typeof claims === 'object' ? claims : null;
  } catch {
    return null;
  }
}

export function isUserAccessToken(token) {
  const claims = jwtClaims(token);
  return Boolean(claims && typeof claims.sub === 'string' && claims.sub && claims.role !== 'anon');
}

function applyGatewayAuth(headers, req) {
  if (!PUBLIC_ANON_KEY) return;
  headers.set('apikey', PUBLIC_ANON_KEY);
  const authorization = header(req, 'authorization');
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!isUserAccessToken(token)) {
    headers.set('authorization', `Bearer ${PUBLIC_ANON_KEY}`);
  }
}

function motivationPayload() {
  const tips = [
    {
      title: 'Nouveau Conseil & Motivation Nia-Mind',
      message: 'Tu n’as pas besoin de porter toutes les attentes du monde en même temps. Choisis une seule priorité sincère aujourd’hui.',
    },
    {
      title: 'Motivation du jour',
      message: 'Reconnaître sa fatigue n’est pas un aveu de faiblesse. Nomme ce que tu ressens, sans te juger.',
    },
    {
      title: 'Conseil du jour',
      message: 'Ton esprit a besoin d’un sas avant le repos. Trois minutes de calme changent déjà la soirée.',
    },
  ];
  const tip = tips[new Date().getUTCDate() % tips.length];
  return { ok: true, mode: 'daily_motivation', source: 'bridge', pushNotification: tip };
}

function clientIp(req) {
  return (header(req, 'x-real-ip') || header(req, 'x-forwarded-for').split(',')[0] || 'anonymous')
    .trim()
    .slice(0, 80);
}

const AUTH_LIMIT_ERROR =
  'LIMITE DE SÉCURITÉ (3 essais / 15s) : trop de tentatives d’identification. Patientez avant de réessayer.';

function limited(key, max, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > max) return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return null;
}

async function sha256Hex(value) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  const text = String(value || '');
  if (!subtle) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isCredentialPath(path, search) {
  if (path.startsWith('auth/v1/signup')) return true;
  if (path.startsWith('auth/v1/recover')) return true;
  if (path.startsWith('auth/v1/otp')) return true;
  if (path.startsWith('auth/v1/verify')) return true;
  if (path.startsWith('auth/v1/token') && !String(search || '').includes('grant_type=refresh_token')) return true;
  return false;
}

function emailFromBody(body) {
  if (!body || !body.length || body.length > 8000) return '';
  const text = body.toString('utf8');
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.email === 'string') return parsed.email.trim().toLowerCase().slice(0, 180);
  } catch {
    const fromForm = new URLSearchParams(text).get('email');
    if (fromForm) return fromForm.trim().toLowerCase().slice(0, 180);
  }
  return '';
}

async function durableCredentialRetry(ip, email) {
  const keys = email
    ? [`id:${await sha256Hex(email)}`, `ip:${await sha256Hex(ip || 'anonymous')}`]
    : [`id:${await sha256Hex(`ip:${ip || 'anonymous'}`)}`];
  for (const key of keys) {
    const response = await fetch(`${ORIGIN}/rest/v1/rpc/consume_auth_rate`, {
      method: 'POST',
      headers: {
        apikey: PUBLIC_ANON_KEY,
        authorization: `Bearer ${PUBLIC_ANON_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_key: key }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.allowed === false) return Math.max(1, Number(data.retry_after_sec) || 15);
  }
  return 0;
}

function readBody(req) {
  if (typeof req.on !== 'function') return Promise.resolve(Buffer.alloc(0));
  const chunks = [];
  let total = 0;
  return new Promise((resolve) => {
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 1024 * 1024) {
        resolve('too-large');
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

function upstreamPath(req) {
  const host = header(req, 'host') || 'nia-mind.vercel.app';
  const current = new URL(req.url || '/api/bridge', `https://${host}`);
  let path = current.searchParams.get('path') || 'health';
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  path = path.replace(/^\/+/, '');
  if (!path || path.length > 512 || path.includes('..') || path.includes('\\') || path.includes('://') || path.includes('\0')) {
    return null;
  }
  const search = new URLSearchParams(current.search);
  search.delete('path');
  return { path, search: search.toString() };
}

export default async function handler(req, res) {
  try {
    const method = String(req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('cache-control', 'private, no-store');
      res.end();
      return;
    }
    const target = upstreamPath(req);
    if (!target) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Chemin de requête refusé par le pont.' }));
      return;
    }
    if (target.path === 'health') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'private, no-store');
      res.setHeader('x-nia-proxy', 'bridge');
      res.end(JSON.stringify({ ok: true, bridge: 'gateway' }));
      return;
    }
    if (target.path === 'functions/v1/push-daily-motivation') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'private, no-store');
      res.setHeader('x-nia-proxy', 'bridge');
      res.end(JSON.stringify(motivationPayload()));
      return;
    }
    const allowed = ALLOWED.some((prefix) => target.path === prefix.slice(0, -1) || target.path.startsWith(prefix));
    if (!allowed || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(method)) {
      res.statusCode = allowed ? 405 : 400;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: allowed ? 'Méthode non autorisée.' : 'Chemin de requête refusé par le pont.' }));
      return;
    }

    const hasBody = method !== 'GET' && method !== 'HEAD';
    const body = hasBody ? await readBody(req) : null;
    if (body === 'too-large') {
      res.statusCode = 413;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Requête trop volumineuse.' }));
      return;
    }

    const ip = clientIp(req);
    const authCall = target.path.startsWith('auth/v1/') && ['POST', 'PUT', 'PATCH'].includes(method);
    const credential = authCall && isCredentialPath(target.path, target.search);
    if (credential) {
      let retry = null;
      try {
        retry = await durableCredentialRetry(ip, emailFromBody(body));
      } catch {
        retry = null;
      }
      if (retry === null) {
        const email = emailFromBody(body);
        retry = limited(`auth-id:${await sha256Hex(email || ip)}`, 3, 15_000)
          || limited(`auth-ip:${ip}`, 15, 15_000);
      } else if (retry === 0) {
        retry = null;
      }
      if (retry) {
        res.statusCode = 429;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('retry-after', String(retry));
        res.setHeader('cache-control', 'private, no-store');
        res.end(JSON.stringify({
          error: AUTH_LIMIT_ERROR,
          msg: AUTH_LIMIT_ERROR,
          error_description: AUTH_LIMIT_ERROR,
        }));
        return;
      }
    } else if (authCall) {
      const retry = limited(`auth:${ip}`, 8, 15_000);
      if (retry) {
        res.statusCode = 429;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('retry-after', String(retry));
        res.setHeader('cache-control', 'private, no-store');
        res.end(JSON.stringify({ error: 'Trop de requêtes. Réessayez dans un instant.' }));
        return;
      }
    }
    const general = limited(`all:${ip}`, 120, 10_000);
    if (general) {
      res.statusCode = 429;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('retry-after', String(general));
      res.setHeader('cache-control', 'private, no-store');
      res.end(JSON.stringify({ error: 'Trop de requêtes. Réessayez dans un instant.' }));
      return;
    }

    const headers = new Headers();
    for (const name of ['authorization', 'apikey', 'content-type', 'accept', 'accept-profile', 'content-profile', 'prefer', 'range', 'x-client-info', 'x-upsert', 'x-supabase-api-version']) {
      const value = header(req, name);
      if (value && !/[\r\n\0]/.test(value)) headers.set(name, value);
    }
    applyGatewayAuth(headers, req);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const upstream = await fetch(`${ORIGIN}/${target.path}${target.search ? `?${target.search}` : ''}`, {
      method,
      headers,
      body: hasBody && body && body.length ? body : undefined,
      signal: controller.signal,
      redirect: 'manual',
    }).finally(() => clearTimeout(timer));

    res.statusCode = upstream.status;
    res.setHeader('cache-control', 'private, no-store');
    res.setHeader('x-nia-proxy', 'bridge');
    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('content-type', type);
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.setHeader('retry-after', retryAfter);
    const bytes = Buffer.from(await upstream.arrayBuffer());
    res.end(bytes.subarray(0, 1536 * 1024));
  } catch {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'private, no-store');
    res.end(JSON.stringify({ error: 'Le pont vers la base est indisponible pour le moment.' }));
  }
}
