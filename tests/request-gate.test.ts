import { beforeEach, describe, expect, it } from 'vitest';
import { proxyBackendRequest } from '../api/backendProxy';
import { processAssistantPayload } from '../api/assistant';
import {
  resetRequestGateForTests,
  sanitizeBackendPath,
} from '../api/requestGate';

const ORIGIN = 'https://wyiiyfjvicwwbcbswdac.supabase.co';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Pont reverse proxy et limitation de débit', () => {
  beforeEach(() => {
    resetRequestGateForTests();
  });

  it('refuse les chemins qui sortiraient du backend autorisé', () => {
    expect(sanitizeBackendPath('/rest/v1/daily_tips')).toBe('/rest/v1/daily_tips');
    expect(sanitizeBackendPath('/auth/v1/token')).toBe('/auth/v1/token');
    expect(sanitizeBackendPath('/rest/v1/../auth/v1/token')).toBeNull();
    expect(sanitizeBackendPath('https://evil.example/rest/v1/daily_tips')).toBeNull();
    expect(sanitizeBackendPath('/realtime/v1/websocket')).toBeNull();
    expect(sanitizeBackendPath('/rest/v1/%2e%2e/auth')).toBeNull();
  });

  it('transmet une lecture vers Supabase et jamais vers un hôte fourni par le client', async () => {
    const calls: string[] = [];
    const response = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/rest/v1/daily_tips?select=id', {
        headers: { apikey: 'public-anon', authorization: 'Bearer visitor' },
      }),
      {
        env: { VITE_SUPABASE_URL: ORIGIN },
        fetchImpl: async (input, init) => {
          calls.push(String(input));
          expect(new Headers(init?.headers).get('apikey')).toBe('public-anon');
          expect(new Headers(init?.headers).get('cookie')).toBeNull();
          return jsonResponse([{ id: 'tip-1' }]);
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-nia-proxy')).toBe('bridge');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(calls).toEqual([`${ORIGIN}/rest/v1/daily_tips?select=id`]);
  });

  it('bloque la 4e tentative d’identification en 15 secondes sans appeler le backend', async () => {
    let calls = 0;
    const send = () =>
      proxyBackendRequest(
        new Request('http://nia-mind.local/backend/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'amina@example.com', password: 'secret' }),
        }),
        {
          env: { VITE_SUPABASE_URL: ORIGIN },
          fetchImpl: async () => {
            calls += 1;
            return jsonResponse({ access_token: 'no' }, 400);
          },
        }
      );

    expect((await send()).status).toBe(400);
    expect((await send()).status).toBe(400);
    expect((await send()).status).toBe(400);
    const blocked = await send();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    expect(calls).toBe(3);
  });

  it('laisse passer un rafraîchissement de session distinct des essais de mot de passe', async () => {
    const response = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'session' }),
      }),
      {
        env: { VITE_SUPABASE_URL: ORIGIN },
        fetchImpl: async () => jsonResponse({ access_token: 'ok' }),
      }
    );
    expect(response.status).toBe(200);
  });

  it('refuse une surcharge de socket et une réponse amont en échec sans fuite de connexion', async () => {
    const upgrade = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/realtime/v1/websocket', {
        headers: { upgrade: 'websocket' },
      })
    );
    expect(upgrade.status).toBe(426);

    const failed = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/rest/v1/daily_tips'),
      {
        env: { VITE_SUPABASE_URL: ORIGIN },
        fetchImpl: async () => {
          throw new Error('upstream down');
        },
      }
    );
    expect(failed.status).toBe(502);

    const recovered = await proxyBackendRequest(
      new Request('http://nia-mind.local/backend/rest/v1/daily_tips'),
      {
        env: { VITE_SUPABASE_URL: ORIGIN },
        fetchImpl: async () => jsonResponse([]),
      }
    );
    expect(recovered.status).toBe(200);
  });

  it('limite l’assistant avant d’appeler le modèle', async () => {
    for (let i = 0; i < 60; i += 1) {
      const allowed = await processAssistantPayload({ message: 'bonjour' }, '203.0.113.10');
      expect(allowed.status).toBe(200);
    }
    const blocked = await processAssistantPayload({ message: 'bonjour' }, '203.0.113.10');
    expect(blocked.status).toBe(429);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
