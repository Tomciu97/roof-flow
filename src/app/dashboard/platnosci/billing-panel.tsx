"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_DOMAIN } from "@/lib/constants";

export function BillingPanel({
  customDomain,
  isPro,
  demo,
  currentPlan,
}: {
  customDomain: string | null;
  isPro: boolean;
  demo?: boolean;
  currentPlan: "starter" | "pro";
}) {
  const [domain, setDomain] = useState(customDomain || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout(plan: "starter" | "pro") {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/checkout/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd checkout");
      if (data.demo) {
        setMsg(
          data.message ||
            "Stripe nie jest jeszcze skonfigurowany. Dodaj STRIPE_SECRET_KEY, aby uruchomić płatność."
        );
        setLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Błąd");
      setLoading(false);
    }
  }

  async function openPortal() {
    if (demo) {
      setMsg(
        "Portal Stripe otworzy się po podłączeniu STRIPE_SECRET_KEY i utworzeniu klienta w Checkout."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd portalu");
      window.location.href = data.url;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Błąd");
      setLoading(false);
    }
  }

  async function addDomain() {
    if (!isPro) {
      setMsg("Własna domena jest dostępna w planie PRO.");
      return;
    }
    if (demo) {
      setMsg("Tryb demo — ustaw VERCEL_API_TOKEN, aby dodać domenę.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd domeny");
      setMsg(
        data.message ||
          "Dodano domenę. Ustaw CNAME → cname.vercel-dns.com."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">Płatności Stripe</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Checkout subskrypcji, faktury VAT i zmiana karty w Customer Portal.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {currentPlan !== "pro" ? (
            <Button
              type="button"
              onClick={() => startCheckout("pro")}
              disabled={loading}
            >
              Przejdź na PRO (Stripe Checkout)
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => startCheckout("starter")}
              disabled={loading}
            >
              Zmień na STARTER
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={openPortal}
            disabled={loading}
          >
            Otwórz portal płatności Stripe
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">Własna domena (PRO)</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          np. kalkulator.dekarzmarian.pl — Vercel Domains API.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Domena</Label>
            <Input
              placeholder="kalkulator.twoja-firma.pl"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={!isPro}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addDomain}
            disabled={loading || !domain || !isPro}
          >
            Dodaj domenę do Vercel
          </Button>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold">Instrukcja DNS</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Rekord <strong>CNAME</strong> → <code>cname.vercel-dns.com</code>
              </li>
              <li>Poczekaj na propagację DNS</li>
              <li>
                Widget pod Twoją domeną zamiast {APP_DOMAIN}/firmy/…
              </li>
            </ol>
          </div>
        </div>
      </div>

      {msg ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
