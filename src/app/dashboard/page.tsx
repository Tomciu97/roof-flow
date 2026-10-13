import { LeadsTable } from "@/components/dashboard/leads-table";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { formatPln } from "@/lib/calculator";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import type { Lead } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Leady",
};

export const instant = false;

const DEMO_LEADS: Lead[] = [
  {
    id: "1",
    tenant_id: "demo",
    client_name: "Anna Kowalska",
    client_phone: "+48 600 111 222",
    client_email: "anna@example.pl",
    location: "Kraków",
    schedule: "wiosna 2027",
    roof_type: "gabled",
    roof_area_m2: 168,
    insulation_area_m2: 193,
    facade_area_m2: 0,
    est_price_min: 92000,
    est_price_max: 108000,
    project_file_url: null,
    status: "new",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    tenant_id: "demo",
    client_name: "Piotr Nowak",
    client_phone: "+48 501 333 444",
    client_email: null,
    location: "Niepołomice",
    schedule: "jesień 2026",
    roof_type: "hip",
    roof_area_m2: 210,
    insulation_area_m2: 0,
    facade_area_m2: 145,
    est_price_min: 140000,
    est_price_max: 165000,
    project_file_url: null,
    status: "contacted",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default async function DashboardPage() {
  const { tenant } = await getCurrentTenant();
  const current = tenant || demoTenant();

  let leads: Lead[] = DEMO_LEADS;
  if (tenant) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      leads = (data as Lead[]) || [];
    } catch {
      leads = DEMO_LEADS;
    }
  }

  const now = new Date();
  const monthLeads = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const pipelineValue = leads.reduce(
    (sum, l) => sum + (Number(l.est_price_max) || 0),
    0
  );
  const signed = leads.filter((l) => l.status === "signed").length;
  const conversion =
    leads.length > 0 ? Math.round((signed / leads.length) * 100) : 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Przegląd leadów</h1>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">
        {current.name} · plan {current.plan_tier.toUpperCase()}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Leady w tym miesiącu"
          value={String(monthLeads.length)}
        />
        <Kpi
          label="Szacunkowa wartość zapytań"
          value={formatPln(pipelineValue)}
        />
        <Kpi label="Współczynnik konwersji" value={`${conversion}%`} />
      </div>

      <div className="mt-10">
        <LeadsTable
          leads={leads}
          statusLabels={LEAD_STATUS_LABELS}
          demo={!tenant}
        />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--rf-border)] bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
