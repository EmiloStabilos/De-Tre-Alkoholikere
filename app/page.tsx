"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryStats } from "@/lib/types";

type CatWithStats = Category & { products: number; ratings: number };

export default function Home() {
  const [cats, setCats] = useState<CatWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: categories }, { data: stats }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("category_stats").select("*"),
      ]);

      const statByCat = new Map(
        ((stats as CategoryStats[]) ?? []).map((s) => [s.category_id, s]),
      );

      setCats(
        ((categories as Category[]) ?? []).map((c) => ({
          ...c,
          products: statByCat.get(c.id)?.product_count ?? 0,
          ratings: statByCat.get(c.id)?.rating_count ?? 0,
        })),
      );
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Hvad smager vi i dag?</h1>
        <p className="mt-1 text-sm text-pine-300">
          Vælg en kategori for at se smagninger, ranglister og statistik.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-pine-800 bg-pine-900"
                />
              ))
            : cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.id}`}
                  className="group flex h-32 flex-col justify-between rounded-2xl border border-pine-800 bg-pine-900 p-4 transition hover:border-gold-500 active:scale-[0.98]"
                >
                  <div className="text-4xl">{c.emoji}</div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-pine-400">
                      {c.products > 0
                        ? `${c.products} drikke · ${c.ratings} smag`
                        : "Ingen endnu"}
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </main>
    </>
  );
}
