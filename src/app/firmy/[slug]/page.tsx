import { notFound } from "next/navigation";
import { CalculatorWizard } from "@/components/calculator/wizard";
import { DEFAULT_PRICING_RATES } from "@/lib/constants";
import type { PricingRates } from "@/lib/types";
import type { Metadata } from "next";

export const instant = false;

async function getTenant(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) return null;

  const { data: pricing } = await supabase
    .from("pricing_configs")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return { tenant, pricing };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTenant(slug);
  if (!data) return { title: "Firma nie znaleziona" };
  return {
    title: `Kalkulator wyceny — ${data.tenant.name}`,
    description: `Bezpłatna wycena dachu u ${data.tenant.name}`,
  };
}

export default async function FirmaWidgetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getTenant(slug);

  // Tryb demo gdy brak Supabase / tenanta — ułatwia lokalny preview
  const demo = !data;
  const tenant = data?.tenant ?? {
    name: "Demo Dekarz",
    slug,
    logo_url: null,
    brand_color: "#0f766e",
    phone: "+48 500 000 000",
    has_insulation_addon: true,
    has_facade_addon: true,
    plan_tier: "pro",
  };
  const pricing = data?.pricing;

  if (!data && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Supabase skonfigurowane, ale slug nie istnieje
    notFound();
  }

  const rates: PricingRates = pricing
    ? {
        ...DEFAULT_PRICING_RATES,
        baseLaborRate: Number(pricing.base_labor_rate),
        timberRate: Number(pricing.timber_rate),
        tileRates: pricing.tile_rates,
        insulationRates: pricing.insulation_rates,
        facadeRates: pricing.facade_rates,
        marginBuffer: Number(pricing.margin_buffer),
      }
    : DEFAULT_PRICING_RATES;

  const brand = tenant.brand_color || "#0f766e";

  return (
    <div className="min-h-screen bg-[var(--rf-bg)]">
      <header
        className="border-b border-black/5"
        style={{ background: brand }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-6 text-white md:px-8">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-12 w-12 rounded-lg bg-white object-contain p-1"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 font-display text-xl font-bold">
              {tenant.name.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-display text-2xl font-semibold">{tenant.name}</p>
            <p className="text-sm text-white/80">
              Kalkulator wyceny
              {tenant.phone ? ` · ${tenant.phone}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
        {demo ? (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tryb podglądu — skonfiguruj Supabase, aby ładować dane firmy.
          </p>
        ) : null}
        <CalculatorWizard
          mode="tenant"
          tenantSlug={tenant.slug}
          brandColor={brand}
          rates={rates}
          showModules={{
            insulation: Boolean(tenant.has_insulation_addon || tenant.plan_tier === "pro"),
            facade: Boolean(tenant.has_facade_addon || tenant.plan_tier === "pro"),
          }}
        />
      </div>
    </div>
  );
}
