"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTaster } from "@/components/TasterProvider";
import { fmtScore, scoreColor, scoreBg } from "@/lib/format";
import type { Product, Rating } from "@/lib/types";

export default function StatsPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const { tasters } = useTaster();
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const byTaster = tasters.map((t) => {
      const rs = ratings.filter((r) => r.taster_id === t.id);
      const avg = rs.length
        ? rs.reduce((a, r) => a + r.score, 0) / rs.length
        : null;
      return { name: t.name, avg, count: rs.length };
    });

    const styleMap = new Map<string, number[]>();
    const prodById = new Map(products.map((p) => [p.id, p]));
    ratings.forEach((r) => {
      const p = prodById.get(r.product_id);
      const style = p?.attributes?.style ? String(p.attributes.style) : null;
      if (style) {
        if (!styleMap.has(style)) styleMap.set(style, []);
        styleMap.get(style)!.push(r.score);
      }
    });
    const byStyle = Array.from(styleMap.entries())
      .map(([style, arr]) => ({
        style,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        count: arr.length,
      }))
      .filter((s) => s.count >= 2)
      .sort((a, b) => b.avg - a.avg);

    const overall = ratings.length
      ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length
      : null;

    return { byTaster, byStyle, overall };
  }, [tasters, ratings, products]);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-stone-800 bg-stone-900" />
    );
  }
  if (ratings.length === 0) {
    return <p className="py-8 text-center text-stone-500">Ingen data endnu.</p>;
  }

  const critics = [...stats.byTaster].filter((t) => t.avg != null);
  const harshest = critics.length
    ? critics.reduce((a, b) => (a.avg! < b.avg! ? a : b))
    : null;
  const generous = critics.length
    ? critics.reduce((a, b) => (a.avg! > b.avg! ? a : b))
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Drikke" value={String(products.length)} />
        <Stat label="Bedømmelser" value={String(ratings.length)} />
        <Stat
          label="Gns. score"
          value={fmtScore(stats.overall)}
          color={scoreColor(stats.overall)}
        />
      </div>

      {(harshest || generous) && (
        <div className="grid grid-cols-2 gap-3">
          {harshest && (
            <Highlight
              emoji="🥶"
              title="Hårdeste kritiker"
              name={harshest.name}
              value={fmtScore(harshest.avg)}
            />
          )}
          {generous && (
            <Highlight
              emoji="🤗"
              title="Mest gavmild"
              name={generous.name}
              value={fmtScore(generous.avg)}
            />
          )}
        </div>
      )}

      <Section title="Gennemsnit per person">
        {stats.byTaster.map((t) => (
          <Bar
            key={t.name}
            label={t.name}
            value={t.avg}
            sub={`${t.count} bedømt`}
          />
        ))}
      </Section>

      {stats.byStyle.length > 0 && (
        <Section title="Bedste stilarter">
          {stats.byStyle.slice(0, 8).map((s) => (
            <Bar
              key={s.style}
              label={s.style}
              value={s.avg}
              sub={`${s.count}★`}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color ?? ""}`}>
        {value}
      </div>
      <div className="text-xs text-stone-500">{label}</div>
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
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-xs text-stone-500">{title}</div>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-stone-400">gns. {value}</div>
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
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
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
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm">
          <span className={`font-bold ${scoreColor(value)}`}>
            {fmtScore(value)}
          </span>
          {sub && <span className="ml-2 text-xs text-stone-600">{sub}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-800">
        <div
          className={`h-full rounded-full ${scoreBg(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
