import { createHash } from 'node:crypto';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function consultDurableAuthRate(
  fetchImpl: typeof fetch,
  origin: string,
  apiKey: string,
  keys: string[]
): Promise<{ allowed: boolean; retryAfterSec: number } | null> {
  if (!apiKey || keys.length === 0) return null;
  let saw = false;
  for (const key of keys) {
    if (!/^(id|ip):[a-f0-9]{64}$/.test(key)) {
      return { allowed: false, retryAfterSec: 15 };
    }
    try {
      const response = await fetchImpl(`${origin}/rest/v1/rpc/consume_auth_rate`, {
        method: 'POST',
        headers: {
          apikey: apiKey,
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ p_key: key }),
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { allowed?: boolean; retry_after_sec?: number };
      saw = true;
      if (data?.allowed === false) {
        return { allowed: false, retryAfterSec: Math.max(1, Number(data.retry_after_sec) || 15) };
      }
    } catch {
      return null;
    }
  }
  return saw ? { allowed: true, retryAfterSec: 0 } : null;
}
