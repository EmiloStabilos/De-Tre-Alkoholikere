"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";
import Sheet from "@/components/Sheet";
import RatingForm from "@/components/RatingForm";
import { useTaster } from "@/components/TasterProvider";
import { createClient } from "@/lib/supabase/client";
import { fmtAbv, fmtScore, scoreColor } from "@/lib/format";
import type { Product, Rating, Taster } from "@/lib/types";

export default function ProductDetail() {
  const params = useParams();
  const categoryId = params.category as string;
  const productId = params.id as string;
  const { current, tasters } = useTaster();

  const [product, setProduct] = useState<Product | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: p }, { data: rts }] = await Promise.all([
      supabase.from("products").select("*").eq("id", productId).maybeSingle(),
      supabase.from("ratings").select("*").eq("product_id", productId),
    ]);
    setProduct(p as Product);
    setRatings((rts as Rating[]) ?? []);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const groupAvg =
    ratings.length === 0
      ? null
      : ratings.reduce((a, r) => a + r.score + (r.extra_points ?? 0), 0) /
        ratings.length;

  const myRating = current
    ? ratings.find((r) => r.taster_id === current.id) ?? null
    : null;

  const tasterName = (id: string) =>
    tasters.find((t) => t.id === id)?.name ?? "?";

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-stone-800 bg-stone-900" />
    );
  }
  if (!product) return <p className="text-stone-500">Findes ikke.</p>;

  const attrs = product.attributes ?? {};

  return (
    <div>
      {product.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.photo_url}
          alt={product.name}
          className="mb-4 h-56 w-full rounded-2xl border border-stone-800 object-cover"
        />
      )}

      <div className="flex items-start gap-4">
        <ScoreBadge score={groupAvg} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
          {product.producer && (
            <p className="text-stone-400">{product.producer}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.abv != null && (
              <Tag>{fmtAbv(product.abv)}</Tag>
            )}
            {Object.entries(attrs).map(([k, v]) => (
              <Tag key={k}>{String(v)}</Tag>
            ))}
            <Tag>
              {ratings.length} bedømmelse{ratings.length === 1 ? "" : "r"}
            </Tag>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        disabled={!current}
        className="mt-5 w-full rounded-xl bg-amber-500 py-3 font-semibold text-stone-950 disabled:opacity-50"
      >
        {!current
          ? "Vælg dig for at bedømme"
          : myRating
            ? "Redigér din bedømmelse"
            : "Tilføj din bedømmelse"}
      </button>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Bedømmelser
      </h3>
      <div className="space-y-2">
        {tasters.map((t: Taster) => {
          const r = ratings.find((x) => x.taster_id === t.id);
          if (!r)
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-stone-800/60 bg-stone-900/40 p-3 text-stone-600"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-800 text-xs font-bold">
                  {t.name[0]}
                </span>
                <span className="text-sm">{t.name} — ikke bedømt</span>
              </div>
            );
          return (
            <div
              key={t.id}
              className="rounded-xl border border-stone-800 bg-stone-900 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-sm font-bold text-stone-950">
                  {t.name[0]}
                </span>
                <span className="flex-1 font-medium">{t.name}</span>
                <span className={`text-lg font-bold ${scoreColor(r.score)}`}>
                  {fmtScore(r.score)}
                  {r.extra_points ? (
                    <span className="text-xs text-amber-400">
                      {" "}
                      +{fmtScore(r.extra_points)}
                    </span>
                  ) : null}
                </span>
              </div>
              {(r.taste_note || r.aroma_note || r.color_note) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-12 text-xs text-stone-400">
                  {r.taste_note && (
                    <span>
                      <span className="text-stone-600">Smag:</span> {r.taste_note}
                    </span>
                  )}
                  {r.aroma_note && (
                    <span>
                      <span className="text-stone-600">Duft:</span> {r.aroma_note}
                    </span>
                  )}
                  {r.color_note && (
                    <span>
                      <span className="text-stone-600">Farve:</span>{" "}
                      {r.color_note}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open && current && (
        <Sheet title={`Din bedømmelse — ${product.name}`} onClose={() => setOpen(false)}>
          <RatingForm
            productId={productId}
            tasterId={current.id}
            sessionId={myRating?.session_id ?? null}
            existing={myRating}
            onSaved={() => {
              setOpen(false);
              load();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-stone-700 bg-stone-950 px-2 py-0.5 text-xs text-stone-300">
      {children}
    </span>
  );
}
