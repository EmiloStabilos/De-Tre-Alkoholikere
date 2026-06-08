"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSessions } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import type { Session } from "@/lib/types";

export default function SessionsPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const s = await getSessions(categoryId);
    setSessions(s);
    const supabase = createClient();
    const { data: ratings } = await supabase
      .from("ratings")
      .select("session_id");
    const c: Record<string, number> = {};
    (ratings ?? []).forEach((r: any) => {
      if (r.session_id) c[r.session_id] = (c[r.session_id] ?? 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        category_id: categoryId,
        name: name.trim(),
        date: date || null,
        location: location.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setName("");
      setDate("");
      setLocation("");
      setAdding(false);
      load();
    }
  };

  return (
    <div>
      <button
        onClick={() => setAdding((a) => !a)}
        className="mb-4 w-full rounded-xl bg-amber-500 py-3 font-semibold text-stone-950 active:scale-[0.99]"
      >
        {adding ? "Annullér" : "+ Ny aften"}
      </button>

      {adding && (
        <form
          onSubmit={create}
          className="mb-5 space-y-3 rounded-xl border border-stone-800 bg-stone-900 p-4"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn (fx Julefrokost hos Emil)"
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sted"
              className="flex-1 rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-stone-950 disabled:opacity-50"
          >
            {saving ? "Gemmer…" : "Opret aften"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-stone-800 bg-stone-900"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-8 text-center text-stone-500">
          Ingen aftener endnu. Opret den første!
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/c/${categoryId}/sessions/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900 p-4 transition hover:border-stone-600 active:scale-[0.99]"
              >
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-stone-500">
                    {[fmtDate(s.date), s.location].filter(Boolean).join(" · ") ||
                      "Ingen dato"}
                  </div>
                </div>
                <span className="text-xs text-stone-600">
                  {counts[s.id] ?? 0} smag →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
