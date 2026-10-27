import { createClient } from '@supabase/supabase-js';
import { notifyRateLimit } from './rateLimitNotice';

const configuredUrl = 'https://wyiiyfjvicwwbcbswdac.supabase.co';
// Clé publique anon. Ne pas lire VITE_SUPABASE_ANON_KEY : le build Vercel
// a déjà figé une clé périmée, et chaque appel Auth devenait un 401.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aWl5Zmp2aWN3d2JjYnN3ZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDUzOTYsImV4cCI6MjEwODI4MTM5Nn0.eNQZagTUKFzGHMEXHkDV13B8fsNm9ImbjrLZ09eoabA';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    configuredUrl &&
      supabaseAnonKey &&
      configuredUrl.startsWith('https://') &&
      !configuredUrl.includes('votre-projet')
  );
}

function gatewayUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/gateway`;
  }
  return 'http://127.0.0.1/api/gateway';
}

function toSingleSegmentBridge(raw: string): string {
  const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1');
  for (const marker of ['/api/gateway/', '/api/bridge/', '/backend/']) {
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) continue;
    const rest = parsed.pathname.slice(index + marker.length);
    const target = new URL('/api/bridge', parsed.origin);
    target.searchParams.set('path', rest);
    parsed.searchParams.forEach((value, key) => target.searchParams.append(key, value));
    return target.toString();
  }
  return raw;
}

const guardedFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : null;
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const bridged = toSingleSegmentBridge(raw);
  const headers = new Headers(request?.headers);
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const method = init?.method || request?.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const response = await fetch(bridged, {
    method,
    headers,
    body: hasBody ? init?.body ?? request?.body : undefined,
    signal: init?.signal || request?.signal,
    credentials: init?.credentials || request?.credentials,
  });
  if (response.status === 429) {
    notifyRateLimit(Number(response.headers.get('retry-after') || '0'));
  }
  return response;
};

export const supabase = isSupabaseConfigured()
  ? createClient(gatewayUrl(), supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: guardedFetch,
      },
    })
  : null;
