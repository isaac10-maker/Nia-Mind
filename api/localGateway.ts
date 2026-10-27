import { processAssistantPayload } from './assistant.js';
import { proxyBackendRequest } from './backendProxy.js';
import { normalizeClientIp } from './requestGate.js';

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

function normalizeBridgeUrl(raw: string): string {
  const url = new URL(raw, 'http://127.0.0.1');
  if (url.pathname !== '/api/bridge') return raw;
  const path = (url.searchParams.get('path') || 'health').replace(/^\/+/, '');
  url.searchParams.delete('path');
  const query = url.searchParams.toString();
  return `/api/gateway/${path}${query ? `?${query}` : ''}`;
}

function headerString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

async function readNodeBody(req: NodeRequest, maxBytes: number): Promise<Buffer | 'too-large'> {
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

export function attachLocalGateway(middlewares: {
  use: (handler: (req: NodeRequest, res: NodeResponse, next: () => void) => void) => void;
}): void {
  middlewares.use((req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    const isAssistant = pathname === '/api/assistant';
    const isBridge =
      pathname === '/backend' ||
      pathname.startsWith('/backend/') ||
      pathname === '/api/gateway' ||
      pathname.startsWith('/api/gateway/') ||
      pathname === '/api/bridge';
    if (!isAssistant && !isBridge) {
      next();
      return;
    }

    void (async () => {
      if (isAssistant) {
        if ((req.method || 'GET') !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'private, no-store');
          res.end(JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }));
          return;
        }
        const rawBody = await readNodeBody(req, 64 * 1024);
        if (rawBody === 'too-large') {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Requête trop volumineuse.' }));
          return;
        }
        const ip = normalizeClientIp(
          headerString(req.headers['x-real-ip']) || req.socket?.remoteAddress || 'local-dev'
        );
        try {
          const parsed = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {};
          const result = await processAssistantPayload(parsed, ip);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'private, no-store');
          res.setHeader('X-Nia-Proxy', 'bridge');
          if (result.retryAfterSec) res.setHeader('Retry-After', String(result.retryAfterSec));
          res.end(JSON.stringify(result.body));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Requête JSON invalide.' }));
        }
        return;
      }

      const host = headerString(req.headers.host) || '127.0.0.1';
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        const flat = headerString(value);
        if (flat) headers.set(key, flat);
      }
      if (!headers.get('x-real-ip') && req.socket?.remoteAddress) {
        headers.set('x-real-ip', req.socket.remoteAddress);
      }
      const method = req.method || 'GET';
      const hasBody = method !== 'GET' && method !== 'HEAD';
      const rawBody = hasBody ? await readNodeBody(req, 1024 * 1024) : Buffer.alloc(0);
      if (rawBody === 'too-large') {
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Requête trop volumineuse.' }));
        return;
      }
      const request = new Request(`http://${host}${normalizeBridgeUrl(req.url || '/backend')}`, {
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
    })().catch(() => {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Le pont vers le backend est indisponible pour le moment.' }));
    });
  });
}
