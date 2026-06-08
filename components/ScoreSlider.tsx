"use client";

import { fmtScore, scoreColor } from "@/lib/format";

// 0–5 in 0.5 steps, touch-friendly.
export default function ScoreSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const full = value >= i + 1;
    const half = !full && value >= i + 0.5;
    return full ? "★" : half ? "⯨" : "☆";
  });

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-lg tracking-widest text-amber-400">
          {stars.join("")}
        </div>
        <div className={`text-2xl font-bold tabular-nums ${scoreColor(value)}`}>
          {fmtScore(value)}
          <span className="text-sm text-stone-500">/5</span>
        </div>
      </div>
      <input
        type="range"
        className="score-range"
        min={0}
        max={5}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="mt-1 flex justify-between px-0.5 text-[10px] text-stone-600">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
