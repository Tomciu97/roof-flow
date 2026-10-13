import { BillingPanel } from "./billing-panel";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { B2B_PRICES } from "@/lib/constants";
import { B2BAddonsList, B2BPlanCards } from "@/components/marketing/plan-cards";
import { isStripeConfigured } from "@/lib/demo-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subskrypcje i płatności",
};

export const instant = false;

export default async function PlatnosciPage() {
  const { tenant, isDemo } = await getCurrentTenant();
  const current = tenant || demoTenant();
  const stripeReady = isStripeConfigured();

  const modules = [
    "Dach",
    current.has_insulation_addon || current.plan_tier === "pro"
      ? "Poddasze"
      : null,
    current.has_facade_addon || current.plan_tier === "pro" ? "Elewacja" : null,
  ].filter(Boolean);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Subskrypcje i płatności
        </h1>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Porównaj plany, zarządzaj kartą przez Stripe i skonfiguruj własną domenę.
        </p>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          stripeReady
            ? "border-teal-200 bg-teal-50 text-teal-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        {stripeReady ? (
          <p>
            <strong>Stripe podłączony.</strong> Checkout i Customer Portal są gotowe do
            płatności testowych / produkcyjnych.
          </p>
        ) : (
          <p>
            <strong>Stripe jeszcze niepodłączony</strong> — jesteś w trybie demo.
            Dodaj <code className="rounded bg-white/70 px-1">STRIPE_SECRET_KEY</code> oraz
            Price ID z <code className="rounded bg-white/70 px-1">.env.example</code>,
            aby uruchomić prawdziwy Checkout.
          </p>
        )}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold">Twój obecny status</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-semibold uppercase">{current.plan_tier}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium">
                {current.subscription_status === "trialing"
                  ? "Okres próbny (14 dni)"
                  : current.subscription_status}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Aktywne moduły</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {modules.join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Cena po trialu</dt>
              <dd className="font-medium">
                {current.plan_tier === "pro"
                  ? `${B2B_PRICES.pro} zł/m-c`
                  : `${B2B_PRICES.starter} zł/m-c`}
              </dd>
            </div>
          </dl>
        </div>

        <BillingPanel
          customDomain={current.custom_domain}
          isPro={current.plan_tier === "pro"}
          demo={isDemo || !tenant || !stripeReady}
          currentPlan={current.plan_tier}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Porównanie planów</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Dokładnie widać, co kupujesz — bez zgadywania z dwóch przycisków.
        </p>
        <div className="mt-6">
          <B2BPlanCards ctaHref="/rejestracja-b2b" />
        </div>
        <B2BAddonsList />
      </section>
    </div>
  );
}
