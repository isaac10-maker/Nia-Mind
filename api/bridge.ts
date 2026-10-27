// Point d'entrée unique du pont. Vercel ne transmet pas les chemins
// imbriqués (/api/gateway/auth/v1/...) à un catch-all hors Next.js.
// vercel.json réécrit donc ces chemins vers /api/bridge?path=...

import { proxyBackendRequest } from './backendProxy.js';

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
  if (typeof req.on !== 'function') return Promise.resolve(Buffer.alloc(0));
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

function bridgePath(req: NodeRequest): string {
  const host = headerString(req.headers.host) || 'nia-mind.vercel.app';
  const current = new URL(req.url || '/api/bridge', `https://${host}`);
  const forwarded = headerString(req.headers['x-forwarded-uri']) || headerString(req.headers['x-invoke-path']);
  const source = forwarded || current.pathname + current.search;
  const sourceUrl = new URL(source, `https://${host}`);
  const explicit = current.searchParams.get('path');
  if (explicit) {
    const path = explicit.replace(/^\/+/, '');
    const search = new URLSearchParams(current.search);
    search.delete('path');
    const query = search.toString();
    return `/api/gateway/${path}${query ? `?${query}` : ''}`;
  }
  if (sourceUrl.pathname.startsWith('/api/gateway') || sourceUrl.pathname.startsWith('/backend')) {
    return `${sourceUrl.pathname}${sourceUrl.search}`;
  }
  return `/api/gateway/health`;
}

export default async function handler(req: NodeRequest, res: NodeResponse): Promise<void> {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const host = headerString(req.headers.host) || 'nia-mind.vercel.app';
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
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
      res.end(JSON.stringify({ error: 'Requête trop volumineuse.' }));
      return;
    }
    const request = new Request(`https://${host}${bridgePath(req)}`, {
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
    res.end(Buffer.from(await proxied.arrayBuffer()));
  } catch {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'private, no-store');
    res.end(JSON.stringify({ error: 'Le pont vers la base est indisponible pour le moment.' }));
  }
}
