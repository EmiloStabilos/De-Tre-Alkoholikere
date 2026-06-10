"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function AddDrinkForm({
  category,
  onCreated,
}: {
  category: Category;
  onCreated: (productId: string) => void;
}) {
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [abv, setAbv] = useState("");
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAttr = (k: string, v: string) =>
    setAttrs((prev) => ({ ...prev, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    let photo_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${category.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setSaving(false);
        setError("Kunne ikke uploade billede.");
        return;
      }
      photo_url = supabase.storage.from("photos").getPublicUrl(path).data
        .publicUrl;
    }

    const cleanAttrs: Record<string, string> = {};
    Object.entries(attrs).forEach(([k, v]) => {
      if (v && v.trim()) cleanAttrs[k] = v.trim();
    });

    const { data, error: insErr } = await supabase
      .from("products")
      .insert({
        category_id: category.id,
        name: name.trim(),
        producer: producer.trim() || null,
        abv: abv ? parseFloat(abv) : null,
        attributes: cleanAttrs,
        photo_url,
      })
      .select()
      .single();

    setSaving(false);
    if (insErr || !data) {
      setError("Kunne ikke gemme drikken.");
      return;
    }
    onCreated(data.id);
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-pine-300">Navn *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="fx Imperial Stout"
          className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-pine-300">Producent</label>
          <input
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="fx Mikkeller"
            className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-pine-300">Alkohol %</label>
          <input
            type="number"
            step="0.1"
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
            placeholder="fx 5.6"
            className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {category.attribute_schema?.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs text-pine-300">{f.label}</label>
          {f.type === "select" ? (
            <select
              value={attrs[f.key] ?? ""}
              onChange={(e) => setAttr(f.key, e.target.value)}
              className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              <option value="">–</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === "number" ? "number" : "text"}
              value={attrs[f.key] ?? ""}
              onChange={(e) => setAttr(f.key, e.target.value)}
              className="w-full rounded-lg border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          )}
        </div>
      ))}

      <div>
        <label className="mb-1 block text-xs text-pine-300">
          Billede (valgfrit)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-pine-300 file:mr-3 file:rounded-lg file:border-0 file:bg-pine-800 file:px-3 file:py-2 file:text-sm file:text-pine-200"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Gemmer…" : "Tilføj og bedøm"}
      </button>
    </form>
  );
}
