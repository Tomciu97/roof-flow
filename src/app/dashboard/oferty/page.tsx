import { MarketplacePanel } from "./marketplace-panel";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { upsertCompany } from "@/lib/marketplace-store";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oferty marketplace — klienci w okolicy",
};

export const instant = false;

export default async function DashboardOfertyPage() {
  const { tenant } = await getCurrentTenant();
  const current = tenant || demoTenant();

  // Sync lokalizacji firmy do magazynu marketplace (demo in-memory)
  upsertCompany({
    id: current.id,
    name: current.name,
    slug: current.slug,
    phone: current.phone || "",
    city: current.city || "",
    postalCode: current.postal_code || "",
    plan: current.plan_tier,
    brandColor: current.brand_color,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Klienci w okolicy
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--rf-muted)]">
          Inwestorzy, którzy kupili wycenę B2C, trafiają tu według miasta i kodu
          pocztowego. Zaproponuj niższą cenę, inne materiały lub szybszy termin —
          klient akceptuje lub odrzuca w swoim panelu ofert.
        </p>
      </div>
      <MarketplacePanel
        tenant={{
          id: current.id,
          name: current.name,
          slug: current.slug,
          phone: current.phone || "",
          city: current.city || "Kraków",
          postalCode: current.postal_code || "30-001",
          plan: current.plan_tier,
        }}
      />
    </div>
  );
}
