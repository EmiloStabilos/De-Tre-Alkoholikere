"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { getCategory } from "@/lib/data";
import type { Category } from "@/lib/types";

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const categoryId = params.category as string;
  const [cat, setCat] = useState<Category | null>(null);

  useEffect(() => {
    getCategory(categoryId).then(setCat);
  }, [categoryId]);

  const base = `/c/${categoryId}`;
  const tabs = [
    { href: base, label: "Rangliste" },
    { href: `${base}/sessions`, label: "Aftener" },
    { href: `${base}/stats`, label: "Statistik" },
  ];

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  return (
    <>
      <TopBar />
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <Link href="/" className="text-sm text-pine-400 hover:text-pine-200">
          ← Alle kategorier
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-4xl">{cat?.emoji ?? "🥤"}</span>
          <h1 className="text-2xl font-bold tracking-tight">
            {cat?.name ?? "…"}
          </h1>
        </div>

        <nav className="mt-4 flex gap-1 rounded-xl border border-pine-800 bg-pine-900 p-1">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
                isActive(t.href)
                  ? "bg-brand-500 text-white"
                  : "text-pine-200 hover:bg-pine-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-4">{children}</main>
    </>
  );
}
