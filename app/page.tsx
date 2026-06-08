"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

type CatWithStats = Category & { products: number; ratings: number };

export default function Home() {
  const [cats, setCats] = useState<CatWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: categories }, { data: products }, { data: ratings }] =
        await Promise.all([
          supabase.from("categories").select("*").order("sort_order"),
          supabase.from("products").select("id, category_id"),
          supabase.from("ratings").select("id, product_id"),
        ]);

      const prodByCat = new Map<string, Set<string>>();
      const prodCat = new Map<string, string>();
      (products ?? []).forEach((p: any) => {
        prodCat.set(p.id, p.category_id);
        if (!prodByCat.has(p.category_id)) prodByCat.set(p.category_id, new Set());
        prodByCat.get(p.category_id)!.add(p.id);
      });
      const ratingsByCat = new Map<string, number>();
      (ratings ?? []).forEach((r: any) => {
        const c = prodCat.get(r.product_id);
        if (c) ratingsByCat.set(c, (ratingsByCat.get(c) ?? 0) + 1);
      });

      setCats(
        (categories ?? []).map((c: Category) => ({
          ...c,
          products: prodByCat.get(c.id)?.size ?? 0,
          ratings: ratingsByCat.get(c.id) ?? 0,
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
        <p className="mt-1 text-sm text-stone-400">
          Vælg en kategori for at se smagninger, ranglister og statistik.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-stone-800 bg-stone-900"
                />
              ))
            : cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.id}`}
                  className="group flex h-32 flex-col justify-between rounded-2xl border border-stone-800 bg-stone-900 p-4 transition hover:border-amber-600 active:scale-[0.98]"
                >
                  <div className="text-4xl">{c.emoji}</div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-stone-500">
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
