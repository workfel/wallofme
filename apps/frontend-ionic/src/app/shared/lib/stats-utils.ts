/**
 * Stats paywall utilities — pure functions for race stats display.
 */

/** Check if ranking + totalParticipants are valid for stats display */
export function hasValidStats(
  ranking: number | null | undefined,
  totalParticipants: number | null | undefined,
): boolean {
  return (
    ranking != null &&
    totalParticipants != null &&
    ranking > 0 &&
    totalParticipants > 0 &&
    ranking <= totalParticipants
  );
}

/** Calculate percentile from ranking/total, clamped to [1, 99] */
export function calculatePercentile(
  ranking: number,
  totalParticipants: number,
): number {
  const raw = Math.round((ranking / totalParticipants) * 100);
  return Math.max(1, Math.min(99, raw));
}

/** Format number with non-breaking spaces as thousands separator: 6847 → "6 847" */
export function formatThousands(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/** Generate a plausible fake ranking string (for blur overlay, never real data) */
export function generateFakeRanking(): string {
  return (Math.floor(Math.random() * 900) + 100).toString();
}

/** Generate a plausible fake total participants string */
export function generateFakeTotalParticipants(): string {
  return formatThousands(Math.floor(Math.random() * 9000) + 1000);
}

/** Generate a plausible fake category ranking string */
export function generateFakeCategoryRanking(): string {
  return (Math.floor(Math.random() * 90) + 10).toString();
}

/** Generate a plausible fake percentile string */
export function generateFakePercentile(): string {
  return (Math.floor(Math.random() * 40) + 5).toString();
}
