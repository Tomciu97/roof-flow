import { BillingPanel } from "./billing-panel";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { B2B_PRICES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subskrypcje i płatności",
};

export const instant = false;

export default async function PlatnosciPage() {
  const { tenant } = await getCurrentTenant();
  const current = tenant || demoTenant();

  const modules = [
    "Dach",
    current.has_insulation_addon || current.plan_tier === "pro"
      ? "Poddasze"
      : null,
    current.has_facade_addon || current.plan_tier === "pro" ? "Elewacja" : null,
  ].filter(Boolean);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">
        Subskrypcje i płatności
      </h1>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">
        Zarządzaj planem, fakturami i własną domeną.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold">Status subskrypcji</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-semibold uppercase">{current.plan_tier}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium">{current.subscription_status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Aktywne moduły</dt>
              <dd className="font-medium text-right">{modules.join(", ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Cennik</dt>
              <dd className="font-medium">
                {current.plan_tier === "pro"
                  ? `${B2B_PRICES.pro} zł/m-c`
                  : `${B2B_PRICES.starter} zł/m-c`}
              </dd>
            </div>
          </dl>
        </section>

        <BillingPanel
          customDomain={current.custom_domain}
          isPro={current.plan_tier === "pro"}
          demo={!tenant}
        />
      </div>
    </div>
  );
}
