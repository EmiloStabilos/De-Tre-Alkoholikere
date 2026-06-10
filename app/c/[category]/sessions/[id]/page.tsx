"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import Sheet from "@/components/Sheet";
import RatingForm from "@/components/RatingForm";
import AddDrinkForm from "@/components/AddDrinkForm";
import { useTaster } from "@/components/TasterProvider";
import { createClient } from "@/lib/supabase/client";
import { avgRatingTotal, fmtDate, fmtScore, scoreColor } from "@/lib/format";
import type { Category, Product, Rating, Session, Taster } from "@/lib/types";

type SheetState =
  | null
  | { mode: "add" }
  | { mode: "rate"; productId: string; existing: Rating | null };

export default function SessionDetail() {
  const params = useParams();
  const categoryId = params.category as string;
  const sessionId = params.id as string;
  const { current, tasters } = useTaster();

  const [category, setCategory] = useState<Category | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: cat }, { data: sess }, { data: rts }] = await Promise.all([
      supabase.from("categories").select("*").eq("id", categoryId).maybeSingle(),
      supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
      supabase.from("ratings").select("*").eq("session_id", sessionId),
    ]);
    setCategory(cat as Category);
    setSession(sess as Session);
    const rlist = (rts as Rating[]) ?? [];
    setRatings(rlist);

    const ids = Array.from(new Set(rlist.map((r) => r.product_id)));
    if (ids.length) {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      const map: Record<string, Product> = {};
      (prods as Product[] | null)?.forEach((p) => (map[p.id] = p));
      setProducts(map);
    }
    setLoading(false);
  }, [categoryId, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Distinct products in this session, ordered by group average (best first).
  const { productIds, avgByProduct, ratingByKey } = useMemo(() => {
    const byProduct = new Map<string, Rating[]>();
    const ratingByKey = new Map<string, Rating>();
    ratings.forEach((r) => {
      if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, []);
      byProduct.get(r.product_id)!.push(r);
      ratingByKey.set(`${r.product_id}:${r.taster_id}`, r);
    });
    const avgByProduct = new Map<string, number | null>();
    byProduct.forEach((rs, pid) => avgByProduct.set(pid, avgRatingTotal(rs)));
    const productIds = Array.from(byProduct.keys()).sort(
      (a, b) => (avgByProduct.get(b) ?? 0) - (avgByProduct.get(a) ?? 0),
    );
    return { productIds, avgByProduct, ratingByKey };
  }, [ratings]);

  const ratingFor = (pid: string, tid: string) =>
    ratingByKey.get(`${pid}:${tid}`) ?? null;

  const openRate = (pid: string) => {
    if (!current) return;
    setSheet({ mode: "rate", productId: pid, existing: ratingFor(pid, current.id) });
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-bold">{session?.name ?? "…"}</h2>
      </div>
      <p className="mb-4 text-sm text-pine-400">
        {[fmtDate(session?.date), session?.location].filter(Boolean).join(" · ")}
      </p>

      {!current && (
        <div className="mb-4 rounded-xl border border-gold-500/40 bg-gold-500/10 p-3 text-sm text-gold-300">
          Vælg hvem du er (øverst til højre) for at bedømme.
        </div>
      )}

      <button
        onClick={() => setSheet({ mode: "add" })}
        className="mb-5 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white active:scale-[0.99]"
      >
        + Tilføj drik til aftenen
      </button>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-pine-800 bg-pine-900"
            />
          ))}
        </div>
      ) : productIds.length === 0 ? (
        <p className="py-8 text-center text-pine-400">
          Ingen drikke endnu. Tilføj den første ovenfor.
        </p>
      ) : (
        <ul className="space-y-3">
          {productIds.map((pid) => {
            const p = products[pid];
            return (
              <li
                key={pid}
                className="rounded-xl border border-pine-800 bg-pine-900 p-3"
              >
                <div className="flex items-center gap-3">
                  <ScoreBadge score={avgByProduct.get(pid) ?? null} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/c/${categoryId}/products/${pid}`}
                      className="block truncate font-semibold hover:text-gold-400"
                    >
                      {p?.name ?? "…"}
                    </Link>
                    <div className="truncate text-xs text-pine-400">
                      {[p?.producer, p?.attributes?.style]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {tasters.map((t: Taster) => {
                    const r = ratingFor(pid, t.id);
                    const isMe = current?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => isMe && openRate(pid)}
                        disabled={!isMe}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                          isMe
                            ? "border-gold-500 bg-gold-500/10"
                            : "border-pine-700 bg-pine-950"
                        } ${!isMe ? "cursor-default" : ""}`}
                        title={isMe ? "Bedøm" : t.name}
                      >
                        <span className="font-medium text-pine-200">
                          {t.name}
                        </span>
                        {r ? (
                          <span className={`font-bold ${scoreColor(r.score)}`}>
                            {fmtScore(r.score)}
                          </span>
                        ) : (
                          <span className="text-pine-500">
                            {isMe ? "+ bedøm" : "–"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sheet?.mode === "add" && category && (
        <Sheet title="Ny drik" onClose={() => setSheet(null)}>
          <AddDrinkForm
            category={category}
            onCreated={(productId) => {
              load();
              if (current) {
                setSheet({ mode: "rate", productId, existing: null });
              } else {
                setSheet(null);
              }
            }}
          />
        </Sheet>
      )}

      {sheet?.mode === "rate" && current && (
        <Sheet
          title={`Din bedømmelse — ${products[sheet.productId]?.name ?? ""}`}
          onClose={() => setSheet(null)}
        >
          <RatingForm
            productId={sheet.productId}
            tasterId={current.id}
            sessionId={sessionId}
            existing={sheet.existing}
            onSaved={() => {
              setSheet(null);
              load();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
