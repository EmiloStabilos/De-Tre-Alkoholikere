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
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Stars value={value} />
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

// Crisp stars at any fraction: a grey ★ with an amber ★ clipped to the
// fill percentage on top. Avoids unreliable half-star glyphs.
function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 text-xl leading-none">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block">
            <span className="text-stone-700">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-amber-400"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}
