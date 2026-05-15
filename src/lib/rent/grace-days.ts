const DEFAULT_GRACE_DAYS = 30;
const MAX_GRACE_DAYS = 366;

/**
 * Read RENT_OVERDUE_GRACE_DAYS at runtime (not module init) so Vercel env updates apply
 * after redeploy. Uses bracket access to avoid build-time inlining of process.env.
 */
export function getRentOverdueGraceDays(): number {
  const raw = process.env["RENT_OVERDUE_GRACE_DAYS"]?.trim();
  if (!raw) return DEFAULT_GRACE_DAYS;

  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return DEFAULT_GRACE_DAYS;
  return Math.min(n, MAX_GRACE_DAYS);
}
