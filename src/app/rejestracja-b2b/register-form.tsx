"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro">("starter");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const slug = slugify(company) || `firma-${Date.now()}`;

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: company, phone },
        },
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Brak użytkownika po rejestracji");

      const { error: tenantErr } = await supabase.from("tenants").insert({
        user_id: authData.user.id,
        name: company,
        slug,
        phone,
        plan_tier: plan,
        subscription_status: "trialing",
        has_insulation_addon: plan === "pro",
        has_facade_addon: plan === "pro",
      });
      if (tenantErr) throw tenantErr;

      const checkout = await fetch("/api/checkout/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, slug }),
      });
      const checkoutData = await checkout.json();
      if (checkout.ok && checkoutData.url) {
        if (String(checkoutData.url).startsWith("http")) {
          window.location.assign(checkoutData.url);
        } else {
          router.push(checkoutData.url);
        }
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zarejestrować"
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
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
      <div>
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label>Plan startowy</Label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["starter", "pro"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                plan === p
                  ? "border-[var(--rf-accent)] bg-teal-50 text-teal-900"
                  : "border-[var(--rf-border)]"
              }`}
            >
              {p === "starter" ? "STARTER" : "PRO"}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Tworzenie konta…" : "Utwórz konto i wybierz plan"}
      </Button>
      <p className="text-center text-sm text-[var(--rf-muted)]">
        Masz już konto?{" "}
        <Link href="/login" className="font-semibold text-[var(--rf-accent)]">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
