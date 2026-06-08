"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTaster } from "@/components/TasterProvider";
import { createClient } from "@/lib/supabase/client";

export default function TopBar() {
  const { tasters, current, setCurrent } = useTaster();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrent(null);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🍻</span>
          <span className="hidden sm:inline">De Tre Alkoholikere</span>
          <span className="sm:hidden">DTA</span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm font-medium"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-xs font-bold text-stone-950">
              {current ? current.name[0] : "?"}
            </span>
            {current ? current.name : "Vælg dig"}
            <span className="text-stone-500">▾</span>
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-stone-700 bg-stone-900 shadow-xl"
              onMouseLeave={() => setOpen(false)}
            >
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-stone-500">
                Hvem er du?
              </div>
              {tasters.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrent(t);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-800 ${
                    current?.id === t.id ? "text-amber-400" : ""
                  }`}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-stone-700 text-xs font-bold">
                    {t.name[0]}
                  </span>
                  {t.name}
                </button>
              ))}
              <button
                onClick={logout}
                className="w-full border-t border-stone-800 px-3 py-2 text-left text-sm text-stone-400 hover:bg-stone-800"
              >
                Log ud
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
