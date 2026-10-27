import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error le pont de production est un module JavaScript sans déclaration.
import handler, { isUserAccessToken } from '../api/bridge.js';

function token(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `eyJhbGciOiJIUzI1NiJ9.${body}.sig`;
}

function mockRes() {
  const headers = new Map<string, string>();
  return {
    statusCode: 0,
    headers,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    end(body?: unknown) {
      this.body = body;
    },
    body: undefined as unknown,
  };
}

describe('Pont : clé publique et fonction de motivation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ne traite pas une clé anon comme une session utilisateur', () => {
    expect(isUserAccessToken(token({ role: 'anon', ref: 'wyiiyfjvicwwbcbswdac' }))).toBe(false);
    expect(isUserAccessToken('pas-un-jeton')).toBe(false);
    expect(isUserAccessToken(token({ role: 'authenticated', sub: 'user-1' }))).toBe(true);
  });

  it('répond 200 à la motivation sans appeler une fonction qui ne démarre pas', async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal('fetch', fetchImpl);
    const res = mockRes();
    await handler({ method: 'GET', url: '/api/bridge?path=functions/v1/push-daily-motivation', headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(String(res.body)).pushNotification.title).toBeTruthy();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('remplace une clé anon refusée avant d’appeler Auth', async () => {
    const seen: { apikey?: string; authorization?: string } = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const headers = new Headers(init.headers);
        seen.apikey = headers.get('apikey') || '';
        seen.authorization = headers.get('authorization') || '';
        return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
      })
    );
    const res = mockRes();
    await handler(
      {
        method: 'GET',
        url: '/api/bridge?path=auth/v1/settings',
        headers: { apikey: 'cle-perimee', authorization: 'Bearer cle-perimee' },
      },
      res
    );
    expect(res.statusCode).toBe(200);
    expect(seen.apikey && seen.apikey !== 'cle-perimee').toBe(true);
    expect(seen.authorization?.startsWith('Bearer ')).toBe(true);
    expect(seen.authorization).not.toBe('Bearer cle-perimee');
  });

  it('conserve le jeton de session d’un utilisateur connecté', async () => {
    const userToken = token({ role: 'authenticated', sub: 'user-1' });
    const seen: { authorization?: string } = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        seen.authorization = new Headers(init.headers).get('authorization') || '';
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      })
    );
    const res = mockRes();
    await handler(
      {
        method: 'GET',
        url: '/api/bridge?path=auth/v1/user',
        headers: { authorization: `Bearer ${userToken}`, apikey: 'cle-perimee' },
      },
      res
    );
    expect(seen.authorization).toBe(`Bearer ${userToken}`);
  });
});
