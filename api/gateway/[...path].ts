// Pont same-origin Vercel : /api/gateway/* et l'alias /backend/*.
// Fonction Node classique. Le Routing Middleware (proxy.ts) faisait tomber
// toute la route en MIDDLEWARE_INVOCATION_FAILED avant même d'atteindre le code.

import { proxyBackendRequest } from '../backendProxy.js';

interface NodeRequest {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  on(event: 'data', listener: (chunk: Buffer) => void): void;
  on(event: 'end', listener: () => void): void;
  on(event: 'error', listener: () => void): void;
}

interface NodeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string | Buffer): void;
}

function headerString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function readNodeBody(req: NodeRequest, maxBytes: number): Promise<Buffer | 'too-large'> {
  const chunks: Buffer[] = [];
  let total = 0;
  return new Promise((resolve) => {
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        resolve('too-large');
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req: NodeRequest, res: NodeResponse): Promise<void> {
  try {
    await handleGateway(req, res);
  } catch {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'private, no-store');
    res.end(JSON.stringify({ error: 'Le pont vers la base est indisponible pour le moment.' }));
  }
}

async function handleGateway(req: NodeRequest, res: NodeResponse): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  const host = headerString(req.headers.host) || 'nia-mind.vercel.app';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const flat = headerString(value);
    if (flat) headers.set(key, flat);
  }
  if (!headers.get('x-real-ip') && req.socket?.remoteAddress) {
    headers.set('x-real-ip', req.socket.remoteAddress);
  }

  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  const rawBody = hasBody ? await readNodeBody(req, 1024 * 1024) : Buffer.alloc(0);
  if (rawBody === 'too-large') {
    res.statusCode = 413;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'private, no-store');
    res.end(JSON.stringify({ error: 'Requête trop volumineuse.' }));
    return;
  }

  const request = new Request(`https://${host}${req.url || '/api/gateway/health'}`, {
    method,
    headers,
    body: hasBody ? new Uint8Array(rawBody) : undefined,
  });
  const proxied = await proxyBackendRequest(request);
  res.statusCode = proxied.status;
  proxied.headers.forEach((value, key) => {
    if (key === 'transfer-encoding' || key === 'content-encoding') return;
    res.setHeader(key, value);
  });
  const bytes = Buffer.from(await proxied.arrayBuffer());
  res.end(bytes);
}
