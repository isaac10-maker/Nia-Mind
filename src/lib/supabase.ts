import { createClient } from '@supabase/supabase-js';
import { notifyRateLimit } from './rateLimitNotice';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const bridged = toSingleSegmentBridge(raw);
  const response = await fetch(bridged, init);
  if (response.status === 429 || response.status === 503) {
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
