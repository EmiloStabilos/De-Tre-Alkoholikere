"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SHARED_EMAIL } from "@/lib/config";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const email = SHARED_EMAIL;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("Forkert kodeord. Prøv igen.");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-gold-500/40 bg-pine-900 text-5xl shadow-lg shadow-black/40">
            🍻
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            De Tre Alkoholikere
          </h1>
          <p className="mt-2 text-sm text-pine-300">
            Indtast det fælles kodeord for at smage med.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Fælles kodeord"
            className="w-full rounded-xl border border-pine-700 bg-pine-900 px-4 py-3 text-center text-lg outline-none focus:border-brand-400"
          />
          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Logger ind…" : "Skål – luk mig ind"}
          </button>
        </form>
      </div>
    </main>
  );
}
