// Shared display helpers.

export function fmtScore(n: number | null | undefined): string {
  if (n === null || n === undefined) return "–";
  return Number(n).toFixed(1).replace(/\.0$/, "");
}

// Tailwind text/bg color for a 0–5 score.
export function scoreColor(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-pine-400";
  if (n < 1.5) return "text-red-400";
  if (n < 2.5) return "text-orange-400";
  if (n < 3.25) return "text-yellow-400";
  if (n < 4) return "text-lime-400";
  return "text-emerald-400";
}

export function scoreBg(n: number | null | undefined): string {
  if (n === null || n === undefined) return "bg-pine-700";
  if (n < 1.5) return "bg-red-500";
  if (n < 2.5) return "bg-orange-500";
  if (n < 3.25) return "bg-yellow-500";
  if (n < 4) return "bg-lime-500";
  return "bg-emerald-500";
}

// Total for a single rating: score plus any bonus points.
export function ratingTotal(r: {
  score: number;
  extra_points: number | null;
}): number {
  return r.score + (r.extra_points ?? 0);
}

// Group average of rating totals; null when there are no ratings.
export function avgRatingTotal(
  rs: { score: number; extra_points: number | null }[],
): number | null {
  if (!rs.length) return null;
  return rs.reduce((a, r) => a + ratingTotal(r), 0) / rs.length;
}

export function fmtAbv(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return `${Number(n).toFixed(1).replace(/\.0$/, "")}%`;
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("da-DK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}
