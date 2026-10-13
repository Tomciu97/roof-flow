import { WidgetStudio } from "./widget-studio";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { APP_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Widget i integracja",
};

export const instant = false;

export default async function WidgetPage() {
  const { tenant } = await getCurrentTenant();
  const current = tenant || demoTenant();
  const publicUrl = `${APP_URL}/firmy/${current.slug}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Widget i integracja</h1>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">
        Dostosuj wygląd i udostępnij kalkulator klientom.
      </p>
      <div className="mt-8">
        <WidgetStudio
          initialColor={current.brand_color || "#0f766e"}
          logoUrl={current.logo_url}
          publicUrl={publicUrl}
          slug={current.slug}
          demo={!tenant}
        />
      </div>
    </div>
  );
}
