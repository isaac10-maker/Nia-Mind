import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { proxyBackendRequest } from '../api/backendProxy';
import { AUTH_LIMIT_ERROR, consultDurableAuthRate, sha256Hex } from '../api/requestGate';

const sql = readFileSync('supabase/migrations/20261030120000_harden_rate_listening_traffic.sql', 'utf8');

describe('residual security fixes', () => {
  it('stores the credential limit in the database and shows the notice only when it is hit', async () => {
    const bridge = readFileSync('api/bridge.js', 'utf8');
    expect(sql).toContain('create table if not exists public.auth_rate_buckets');
    expect(sql).toContain('force row level security');
    expect(sql).toContain('grant execute on function public.consume_auth_rate(text) to anon, authenticated');
    expect(bridge).toContain('consume_auth_rate');
    expect(bridge).toContain(AUTH_LIMIT_ERROR);
    expect(sha256Hex('amina@example.com')).toHaveLength(64);

    const denied = await consultDurableAuthRate(
      async () => new Response(JSON.stringify({ allowed: false, retry_after_sec: 9 }), { status: 200 }),
      'https://wyiiyfjvicwwbcbswdac.supabase.co',
      'public',
      [`id:${sha256Hex('amina@example.com')}`]
    );
    expect(denied).toEqual({ allowed: false, retryAfterSec: 9 });

    let upstream = 0;
    const response = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: 'public' },
        body: JSON.stringify({ email: 'amina@example.com', password: 'secret' }),
      }),
      {
        env: { VITE_SUPABASE_URL: 'https://wyiiyfjvicwwbcbswdac.supabase.co' },
        fetchImpl: async () => {
          upstream += 1;
          return new Response('{}', { status: 400 });
        },
        rateFetch: async () =>
          new Response(JSON.stringify({ allowed: false, retry_after_sec: 9 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      }
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('9');
    expect(await response.json()).toMatchObject({ error: AUTH_LIMIT_ERROR });
    expect(upstream).toBe(0);
  });

  it('freezes listening staff fields for anyone who is not staff', () => {
    expect(sql).toContain('protect_listening_staff_fields');
    expect(sql).toContain('if public.is_staff() then');
    expect(sql).toContain("new.status := 'Envoyée'");
    expect(sql).toContain('new.listener_reply := null');
    expect(sql).toContain('new.status := old.status');
    expect(sql).toContain('new.listener_reply := old.listener_reply');
    expect(sql).toContain('new.assigned_listener := old.assigned_listener');
    expect(sql).toContain('revoke all on function public.protect_listening_staff_fields() from public, anon, authenticated');
  });

  it('counts a public visit from the network, including communities, and ignores a supplied mark', () => {
    const page = readFileSync('src/lib/platformControls.ts', 'utf8');
    const csp = readFileSync('vercel.json', 'utf8');
    expect(sql).toContain("headers->>'cf-connecting-ip'");
    expect(sql).toContain('site_traffic_visitors');
    expect(sql).toContain("'/communautes'");
    expect(sql).not.toContain('p_visitor_hash');
    expect(page).toContain('/rest/v1/rpc/record_page_view');
    expect(page).not.toContain('visitor_hash');
    expect(page).not.toContain("rpc('record_page_view'");
    expect(csp).toContain('https://wyiiyfjvicwwbcbswdac.supabase.co');
  });
});
