"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTaster } from "@/components/TasterProvider";
import { fmtScore, scoreColor, scoreBg } from "@/lib/format";
import type { Product, Rating, Taster } from "@/lib/types";

export default function StatsPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const { tasters } = useTaster();
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all"); // "all" | taster.id

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId);
      const plist = (prods as Product[]) ?? [];
      setProducts(plist);
      if (plist.length) {
        const { data: rts } = await supabase
          .from("ratings")
          .select("*")
          .in(
            "product_id",
            plist.map((p) => p.id),
          );
        setRatings((rts as Rating[]) ?? []);
      }
      setLoading(false);
    })();
  }, [categoryId]);

  const prodById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  // Per-taster aggregates: average given, count, favorite (highest scored)
  // drink, and favorite style.
  const perTaster = useMemo(() => {
    return tasters.map((t) => {
      const rs = ratings.filter((r) => r.taster_id === t.id);
      const avg = rs.length
        ? rs.reduce((a, r) => a + r.score, 0) / rs.length
        : null;
      const ranked = [...rs].sort(
        (a, b) =>
          b.score + (b.extra_points ?? 0) - (a.score + (a.extra_points ?? 0)),
      );
      const styleMap = new Map<string, number[]>();
      rs.forEach((r) => {
        const style = prodById.get(r.product_id)?.attributes?.style;
        if (style) {
          const k = String(style);
          if (!styleMap.has(k)) styleMap.set(k, []);
          styleMap.get(k)!.push(r.score);
        }
      });
      const favStyle = Array.from(styleMap.entries())
        .map(([style, arr]) => ({
          style,
          avg: arr.reduce((a, b) => a + b, 0) / arr.length,
          count: arr.length,
        }))
        .filter((s) => s.count >= 2)
        .sort((a, b) => b.avg - a.avg)[0];
      return { taster: t, ratings: rs, avg, ranked, favStyle };
    });
  }, [tasters, ratings, prodById]);

  const overall = ratings.length
    ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length
    : null;

  const byStyle = useMemo(() => {
    const styleMap = new Map<string, number[]>();
    ratings.forEach((r) => {
      const style = prodById.get(r.product_id)?.attributes?.style;
      if (style) {
        const k = String(style);
        if (!styleMap.has(k)) styleMap.set(k, []);
        styleMap.get(k)!.push(r.score);
      }
    });
    return Array.from(styleMap.entries())
      .map(([style, arr]) => ({
        style,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        count: arr.length,
      }))
      .filter((s) => s.count >= 2)
      .sort((a, b) => b.avg - a.avg);
  }, [ratings, prodById]);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-pine-800 bg-pine-900" />
    );
  }
  if (ratings.length === 0) {
    return <p className="py-8 text-center text-pine-400">Ingen data endnu.</p>;
  }

  const critics = perTaster.filter((t) => t.avg != null);
  const harshest = critics.length
    ? critics.reduce((a, b) => (a.avg! < b.avg! ? a : b))
    : null;
  const generous = critics.length
    ? critics.reduce((a, b) => (a.avg! > b.avg! ? a : b))
    : null;

  const selected = perTaster.find((p) => p.taster.id === filter) ?? null;
  const name = (id: string) =>
    prodById.get(id)?.name ?? "Ukendt";

  return (
    <div className="space-y-6">
      {/* Person filter */}
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Alle
        </Chip>
        {tasters.map((t: Taster) => (
          <Chip
            key={t.id}
            active={filter === t.id}
            onClick={() => setFilter(t.id)}
          >
            {t.name}
          </Chip>
        ))}
      </div>

      {selected ? (
        /* ---------- Single person view ---------- */
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bedømt" value={String(selected.ratings.length)} />
            <Stat
              label="Gns. givet"
              value={fmtScore(selected.avg)}
              color={scoreColor(selected.avg)}
            />
            <Stat
              label="Yndlingsstil"
              value={selected.favStyle?.style ?? "–"}
              small
            />
          </div>

          <Section title={`${selected.taster.name}s favoritter`}>
            {selected.ranked.slice(0, 8).map((r, i) => (
              <FavRow
                key={r.id}
                rank={i + 1}
                href={`/c/${categoryId}/products/${r.product_id}`}
                name={name(r.product_id)}
                producer={prodById.get(r.product_id)?.producer ?? null}
                score={r.score + (r.extra_points ?? 0)}
              />
            ))}
          </Section>

          {selected.ranked.length > 3 && (
            <Section title={`${selected.taster.name}s bundskrabere`}>
              {[...selected.ranked]
                .reverse()
                .slice(0, 3)
                .map((r, i) => (
                  <FavRow
                    key={r.id}
                    rank={selected.ranked.length - i}
                    href={`/c/${categoryId}/products/${r.product_id}`}
                    name={name(r.product_id)}
                    producer={prodById.get(r.product_id)?.producer ?? null}
                    score={r.score + (r.extra_points ?? 0)}
                  />
                ))}
            </Section>
          )}
        </>
      ) : (
        /* ---------- Everyone view ---------- */
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Drikke" value={String(products.length)} />
            <Stat label="Bedømmelser" value={String(ratings.length)} />
            <Stat
              label="Gns. score"
              value={fmtScore(overall)}
              color={scoreColor(overall)}
            />
          </div>

          {(harshest || generous) && (
            <div className="grid grid-cols-2 gap-3">
              {harshest && (
                <Highlight
                  emoji="🥶"
                  title="Hårdeste kritiker"
                  name={harshest.taster.name}
                  value={fmtScore(harshest.avg)}
                />
              )}
              {generous && (
                <Highlight
                  emoji="🤗"
                  title="Mest gavmild"
                  name={generous.taster.name}
                  value={fmtScore(generous.avg)}
                />
              )}
            </div>
          )}

          <Section title="Hver persons favorit">
            {perTaster.map((p) => {
              const fav = p.ranked[0];
              return (
                <button
                  key={p.taster.id}
                  onClick={() => setFilter(p.taster.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-pine-800 bg-pine-900 p-3 text-left transition hover:border-gold-500"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
                    {p.taster.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-pine-400">
                      {p.taster.name}s favorit
                    </div>
                    <div className="truncate font-semibold">
                      {fav ? name(fav.product_id) : "Ingen endnu"}
                    </div>
                  </div>
                  {fav && (
                    <span
                      className={`text-lg font-bold ${scoreColor(
                        fav.score + (fav.extra_points ?? 0),
                      )}`}
                    >
                      {fmtScore(fav.score + (fav.extra_points ?? 0))}
                    </span>
                  )}
                </button>
              );
            })}
          </Section>

          <Section title="Gennemsnit per person">
            {perTaster.map((p) => (
              <Bar
                key={p.taster.id}
                label={p.taster.name}
                value={p.avg}
                sub={`${p.ratings.length} bedømt`}
              />
            ))}
          </Section>

          {byStyle.length > 0 && (
            <Section title="Bedste stilarter">
              {byStyle.slice(0, 8).map((s) => (
                <Bar key={s.style} label={s.style} value={s.avg} sub={`${s.count}★`} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-pine-700 bg-pine-900 text-pine-200 hover:border-pine-400"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-pine-800 bg-pine-900 p-3 text-center">
      <div
        className={`font-bold tabular-nums ${small ? "text-base" : "text-2xl"} ${
          color ?? ""
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-pine-400">{label}</div>
    </div>
  );
}

function Highlight({
  emoji,
  title,
  name,
  value,
}: {
  emoji: string;
  title: string;
  name: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-pine-800 bg-pine-900 p-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-xs text-pine-400">{title}</div>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-pine-300">gns. {value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-pine-400">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FavRow({
  rank,
  href,
  name,
  producer,
  score,
}: {
  rank: number;
  href: string;
  name: string;
  producer: string | null;
  score: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-pine-800 bg-pine-900 p-3 transition hover:border-pine-500"
    >
      <span className="w-5 shrink-0 text-center text-sm font-bold text-pine-400">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{name}</div>
        {producer && (
          <div className="truncate text-xs text-pine-400">{producer}</div>
        )}
      </div>
      <span className={`text-lg font-bold ${scoreColor(score)}`}>
        {fmtScore(score)}
      </span>
    </Link>
  );
}

function Bar({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | null;
  sub?: string;
}) {
  const pct = value != null ? (value / 5) * 100 : 0;
  return (
    <div className="rounded-xl border border-pine-800 bg-pine-900 p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm">
          <span className={`font-bold ${scoreColor(value)}`}>
            {fmtScore(value)}
          </span>
          {sub && <span className="ml-2 text-xs text-pine-500">{sub}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-pine-800">
        <div
          className={`h-full rounded-full ${scoreBg(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
