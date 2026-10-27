export function notifyRateLimit(retryAfterSec = 0): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('nia-rate-limited', {
      detail: { retryAfterSec: Number.isFinite(retryAfterSec) ? retryAfterSec : 0 },
    })
  );
}
