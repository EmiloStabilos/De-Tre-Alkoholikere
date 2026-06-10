"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import { getLeaderboard, getProduct } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { fmtAbv } from "@/lib/format";
import type { Product, ProductAverage } from "@/lib/types";

export default function LeaderboardPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const [rows, setRows] = useState<ProductAverage[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const lb = await getLeaderboard(categoryId);
      setRows(lb);
      const supabase = createClient();
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId);
      const map: Record<string, Product> = {};
      (prods as Product[] | null)?.forEach((p) => (map[p.id] = p));
      setProducts(map);
      setLoading(false);
    })();
  }, [categoryId]);

  const styles = useMemo(() => {
    const s = new Set<string>();
    Object.values(products).forEach((p) => {
      const v = p.attributes?.style;
      if (v) s.add(String(v));
    });
    return Array.from(s).sort();
  }, [products]);

  const filtered = rows.filter((r) => {
    const p = products[r.product_id];
    const matchesQuery =
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.producer ?? "").toLowerCase().includes(query.toLowerCase());
    const matchesStyle = !style || String(p?.attributes?.style ?? "") === style;
    return matchesQuery && matchesStyle;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-pine-800 bg-pine-900"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-pine-700 p-8 text-center">
        <p className="text-pine-300">Ingen smagninger her endnu.</p>
        <Link
          href={`/c/${categoryId}/sessions`}
          className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Start en aften
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg navn eller producent…"
          className="flex-1 rounded-xl border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        {styles.length > 0 && (
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="rounded-xl border border-pine-700 bg-pine-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="">Alle stilarter</option>
            {styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      <ol className="space-y-2">
        {filtered.map((r, i) => {
          const p = products[r.product_id];
          return (
            <li key={r.product_id}>
              <Link
                href={`/c/${categoryId}/products/${r.product_id}`}
                className="flex items-center gap-3 rounded-xl border border-pine-800 bg-pine-900 p-3 transition hover:border-pine-500 active:scale-[0.99]"
              >
                <span className="w-6 shrink-0 text-center text-sm font-bold text-pine-400">
                  {i + 1}
                </span>
                <ScoreBadge score={r.avg_total} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="truncate text-xs text-pine-400">
                    {[r.producer, p?.attributes?.style, fmtAbv(p?.abv)]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-pine-500">
                  {r.num_ratings}★
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
