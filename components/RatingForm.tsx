"use client";

import { useState } from "react";
import ScoreSlider from "@/components/ScoreSlider";
import { createClient } from "@/lib/supabase/client";
import type { Rating } from "@/lib/types";

export default function RatingForm({
  productId,
  tasterId,
  sessionId,
  existing,
  onSaved,
}: {
  productId: string;
  tasterId: string;
  sessionId: string | null;
  existing?: Rating | null;
  onSaved: () => void;
}) {
  const [score, setScore] = useState(existing?.score ?? 3);
  const [taste, setTaste] = useState(existing?.taste_note ?? "");
  const [aroma, setAroma] = useState(existing?.aroma_note ?? "");
  const [color, setColor] = useState(existing?.color_note ?? "");
  const [extra, setExtra] = useState(
    existing?.extra_points != null ? String(existing.extra_points) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      product_id: productId,
      taster_id: tasterId,
      session_id: sessionId,
      score,
      extra_points: extra ? parseFloat(extra) : null,
      taste_note: taste.trim() || null,
      aroma_note: aroma.trim() || null,
      color_note: color.trim() || null,
    };
    // Unique (product_id, taster_id) — upsert keeps one rating per taster.
    const { error: upsertErr } = await supabase
      .from("ratings")
      .upsert(payload, { onConflict: "product_id,taster_id" });
    setSaving(false);
    if (upsertErr) {
      setError("Kunne ikke gemme bedømmelsen. Prøv igen.");
      return;
    }
    onSaved();
  };

  return (
    <div className="space-y-4">
      <ScoreSlider value={score} onChange={setScore} />

      <div className="grid grid-cols-1 gap-3">
        <Field label="Smag" value={taste} onChange={setTaste} placeholder="fx Bitter banan" />
        <Field label="Duft" value={aroma} onChange={setAroma} placeholder="fx Citrus" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Farve" value={color} onChange={setColor} placeholder="fx Lys" />
          <div>
            <label className="mb-1 block text-xs text-pine-300">
              Ekstra point
            </label>
            <input
              type="number"
              step="0.5"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Gemmer…" : existing ? "Opdatér bedømmelse" : "Gem bedømmelse"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-pine-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </div>
  );
}
