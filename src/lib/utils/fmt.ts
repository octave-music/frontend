// src/lib/utils/fmtTime.ts (or a similar utility path)
/** Convert seconds => mm:ss. */
export function fmtTime(raw?: number): string {
  const t = Number.isFinite(raw) && raw! > 0 ? raw! : 0;   // guards ∞ / NaN
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}