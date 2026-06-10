import { fmtScore, scoreColor } from "@/lib/format";

export default function ScoreBadge({
  score,
  size = "md",
}: {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-lg";
  return (
    <div
      className={`grid ${dim} shrink-0 place-items-center rounded-xl border border-pine-700 bg-pine-900 font-bold tabular-nums ${scoreColor(
        score,
      )}`}
    >
      {fmtScore(score)}
    </div>
  );
}
