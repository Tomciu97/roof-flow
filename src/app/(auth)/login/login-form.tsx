"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("demo@roofflow.pl");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enterDemo(
    company = "Demo Dekarz Marian",
    opts?: { city?: string; postalCode?: string; plan?: "starter" | "pro" }
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email,
          company,
          city: opts?.city || "Kraków",
          postalCode: opts?.postalCode || "30-001",
          plan: opts?.plan || "starter",
          phone: "+48 500 100 200",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd trybu demo");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zalogować");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Wersja testowa: zawsze logujemy do trybu demonstracyjnego
    await enterDemo();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
        <p className="font-semibold">Tryb demonstracyjny</p>
        <p className="mt-1 text-amber-900/80">
          Możesz klikać bez Supabase i Stripe — wejdziesz od razu do panelu z
          przykładowymi leadami. Płatności podłączysz później kluczami testowymi.
        </p>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={4}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Otwieranie panelu…" : "Wejdź do panelu (demo)"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() =>
          enterDemo("Firma PRO Demo", {
            city: "Kraków",
            postalCode: "30-001",
            plan: "pro",
          })
        }
      >
        Szybkie wejście jednym kliknięciem
      </Button>
      <p className="text-center text-sm text-[var(--rf-muted)]">
        Chcesz zobaczyć rejestrację z planami?{" "}
        <Link
          href="/rejestracja-b2b"
          className="font-semibold text-[var(--rf-accent)]"
        >
          Rejestracja B2B
        </Link>
      </p>
    </form>
  );
}
