"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { B2BAddonsList, B2BPlanCards } from "@/components/marketing/plan-cards";
import type { B2BPlanId } from "@/lib/plans";
import { slugify } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const initialPlan =
    search.get("plan") === "pro" ? ("pro" as const) : ("starter" as const);

  const [company, setCompany] = useState("Dekarz Marian");
  const [phone, setPhone] = useState("+48 500 100 200");
  const [email, setEmail] = useState("demo@roofflow.pl");
  const [password, setPassword] = useState("demo1234");
  const [plan, setPlan] = useState<B2BPlanId>(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          company,
          phone,
          email,
          plan,
          checkout: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd rejestracji demo");

      // Próba Stripe Checkout (gdy skonfigurowane) — inaczej dashboard
      const checkout = await fetch("/api/checkout/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, slug: slugify(company), demo: true }),
      });
      const checkoutData = await checkout.json();
      if (checkout.ok && checkoutData.url && !checkoutData.demo) {
        window.location.assign(checkoutData.url);
        return;
      }

      router.push(`/dashboard?plan=${plan}&trial=1`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zarejestrować"
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Wersja testowa do pokazania klientowi</p>
        <p className="mt-1 text-amber-900/80">
          Formularz zapisuje sesję demo w przeglądarce i otwiera panel. Gdy
          dodasz klucze Stripe (`STRIPE_SECRET_KEY` + Price ID), ten sam flow
          uruchomi Checkout z 14-dniowym trialem.
        </p>
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold">1. Wybierz plan</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Kliknij kartę, aby zobaczyć różnice i wybrać pakiet.
        </p>
        <div className="mt-5">
          <B2BPlanCards
            interactive
            selected={plan}
            onSelect={setPlan}
          />
        </div>
        <B2BAddonsList />
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">2. Dane firmy</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="company">Nazwa firmy</Label>
            <Input
              id="company"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="np. Dekarz Marian"
            />
            {company ? (
              <p className="mt-1 text-xs text-slate-500">
                Adres widgetu: /firmy/{slugify(company) || "…"}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="phone">Telefon kontaktowy</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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
          <div className="sm:col-span-2">
            <Label htmlFor="password">Hasło (demo — dowolne)</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-col gap-3 border-t border-[var(--rf-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--rf-muted)]">
          Wybrany plan:{" "}
          <strong className="text-[var(--rf-ink)] uppercase">{plan}</strong>
          {" · "}14 dni gratis, potem płatność Stripe
        </p>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Tworzenie konta…" : "Wejdź do panelu z wybranym planem"}
        </Button>
      </div>

      <p className="text-center text-sm text-[var(--rf-muted)]">
        Masz już konto?{" "}
        <Link href="/login" className="font-semibold text-[var(--rf-accent)]">
          Zaloguj się (demo)
        </Link>
      </p>
    </form>
  );
}
