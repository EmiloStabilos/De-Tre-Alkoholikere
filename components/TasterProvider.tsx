"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Taster } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Ctx = {
  tasters: Taster[];
  current: Taster | null;
  setCurrent: (t: Taster | null) => void;
  refresh: () => Promise<void>;
};

const TasterContext = createContext<Ctx>({
  tasters: [],
  current: null,
  setCurrent: () => {},
  refresh: async () => {},
});

const STORAGE_KEY = "dta_current_taster";

export function TasterProvider({ children }: { children: React.ReactNode }) {
  const [tasters, setTasters] = useState<Taster[]>([]);
  const [current, setCurrentState] = useState<Taster | null>(null);

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasters")
      .select("*")
      .order("sort_order");
    setTasters((data as Taster[]) ?? []);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Resolve the stored taster once the list loads.
  useEffect(() => {
    if (!tasters.length) return;
    const storedId =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (storedId) {
      const found = tasters.find((t) => t.id === storedId);
      if (found) setCurrentState(found);
    }
  }, [tasters]);

  const setCurrent = (t: Taster | null) => {
    setCurrentState(t);
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(STORAGE_KEY, t.id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TasterContext.Provider value={{ tasters, current, setCurrent, refresh }}>
      {children}
    </TasterContext.Provider>
  );
}

export const useTaster = () => useContext(TasterContext);
