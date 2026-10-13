import { PricingForm } from "./pricing-form";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { DEFAULT_PRICING_RATES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konfigurator cennika",
};

export const instant = false;

export default async function CennikPage() {
  const { tenant, pricing } = await getCurrentTenant();
  const current = tenant || demoTenant();

  const initial = {
    baseLaborRate: pricing
      ? Number(pricing.base_labor_rate)
      : DEFAULT_PRICING_RATES.baseLaborRate,
    timberRate: pricing
      ? Number(pricing.timber_rate)
      : DEFAULT_PRICING_RATES.timberRate,
    tileBudget: pricing?.tile_rates?.budget ?? DEFAULT_PRICING_RATES.tileRates.budget,
    tileStandard:
      pricing?.tile_rates?.standard ?? DEFAULT_PRICING_RATES.tileRates.standard,
    tilePremium:
      pricing?.tile_rates?.premium ?? DEFAULT_PRICING_RATES.tileRates.premium,
    insulationWool:
      pricing?.insulation_rates?.wool ??
      DEFAULT_PRICING_RATES.insulationRates.wool,
    insulationPur:
      pricing?.insulation_rates?.pur ?? DEFAULT_PRICING_RATES.insulationRates.pur,
    insulationPir:
      pricing?.insulation_rates?.pir ?? DEFAULT_PRICING_RATES.insulationRates.pir,
    facadeStyrofoam:
      pricing?.facade_rates?.styrofoam ??
      DEFAULT_PRICING_RATES.facadeRates.styrofoam,
    facadeWool:
      pricing?.facade_rates?.wool ?? DEFAULT_PRICING_RATES.facadeRates.wool,
    marginBuffer: pricing
      ? Number(pricing.margin_buffer)
      : DEFAULT_PRICING_RATES.marginBuffer,
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Konfigurator cennika</h1>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">
        Stawki używane w publicznym kalkulatorze firmy {current.name}.
      </p>
      <div className="mt-8">
        <PricingForm
          initial={initial}
          showInsulation={
            current.has_insulation_addon || current.plan_tier === "pro"
          }
          showFacade={current.has_facade_addon || current.plan_tier === "pro"}
          demo={!tenant}
        />
      </div>
    </div>
  );
}
