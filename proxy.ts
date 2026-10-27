import { ipAddress, next } from '@vercel/functions';
import { proxyBackendRequest } from './api/backendProxy';
import { clientIpFromHeaders, consumeRateLimit } from './api/requestGate';

export const config = {
  runtime: 'nodejs',
  matcher: ['/backend/:path*', '/api/:path*'],
};

function tooLarge(): Response {
  return new Response(JSON.stringify({ error: 'Requête trop volumineuse.' }), {
    status: 413,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}

export default async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const ip = ipAddress(request) || clientIpFromHeaders(request.headers);
  const stamped = new Request(request, {
    headers: new Headers(request.headers),
  });
  if (!stamped.headers.get('x-real-ip')) stamped.headers.set('x-real-ip', ip);

  if (url.pathname === '/backend' || url.pathname.startsWith('/backend/')) {
    return proxyBackendRequest(stamped);
  }

  const declared = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declared) && declared > 64 * 1024) return tooLarge();

  if (url.pathname !== '/api/assistant' && url.pathname.startsWith('/api/')) {
    const gate = consumeRateLimit(ip, 'backend');
    if (!gate.allowed) {
      return new Response(JSON.stringify({ error: gate.error }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'private, no-store',
          'retry-after': String(gate.retryAfterSec),
        },
      });
    }
  }

  return next();
}
