import Link from "next/link";
import { notFound } from "next/navigation";
import { formatM2, formatPln } from "@/lib/calculator";
import { demoTenant, getCurrentTenant } from "@/lib/tenant";
import { LEAD_STATUS_LABELS, ROOF_TYPE_LABELS } from "@/lib/constants";
import type { Lead, LeadStatus, RoofType } from "@/lib/types";

export const instant = false;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenant } = await getCurrentTenant();

  let lead: Lead | null = null;

  if (tenant) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    lead = data as Lead | null;
  } else if (id === "1" || id === "2") {
    lead = {
      id,
      tenant_id: "demo",
      client_name: id === "1" ? "Anna Kowalska" : "Piotr Nowak",
      client_phone: id === "1" ? "+48 600 111 222" : "+48 501 333 444",
      client_email: id === "1" ? "anna@example.pl" : null,
      location: id === "1" ? "Kraków" : "Niepołomice",
      schedule: id === "1" ? "wiosna 2027" : "jesień 2026",
      roof_type: id === "1" ? "gabled" : "hip",
      roof_area_m2: id === "1" ? 168 : 210,
      insulation_area_m2: id === "1" ? 193 : 0,
      facade_area_m2: id === "1" ? 0 : 145,
      est_price_min: id === "1" ? 92000 : 140000,
      est_price_max: id === "1" ? 108000 : 165000,
      project_file_url: null,
      status: id === "1" ? "new" : "contacted",
      created_at: new Date().toISOString(),
    };
  }

  if (!lead) notFound();
  const company = tenant?.name || demoTenant().name;

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-[var(--rf-accent)] hover:underline"
      >
        ← Wróć do listy
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        {lead.client_name}
      </h1>
      <p className="text-sm text-[var(--rf-muted)]">
        Lead dla {company} ·{" "}
        {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Kontakt</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Telefon" value={lead.client_phone} />
            <Row label="E-mail" value={lead.client_email || "—"} />
            <Row label="Miejscowość" value={lead.location || "—"} />
            <Row label="Termin" value={lead.schedule || "—"} />
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Wycena</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row
              label="Typ dachu"
              value={
                lead.roof_type
                  ? ROOF_TYPE_LABELS[lead.roof_type as RoofType] ||
                    lead.roof_type
                  : "—"
              }
            />
            <Row
              label="Pow. dachu"
              value={
                lead.roof_area_m2 ? formatM2(Number(lead.roof_area_m2)) : "—"
              }
            />
            <Row
              label="Pow. izolacji"
              value={
                lead.insulation_area_m2
                  ? formatM2(Number(lead.insulation_area_m2))
                  : "—"
              }
            />
            <Row
              label="Pow. elewacji"
              value={
                lead.facade_area_m2
                  ? formatM2(Number(lead.facade_area_m2))
                  : "—"
              }
            />
            <Row
              label="Budżet"
              value={
                lead.est_price_min
                  ? `${formatPln(Number(lead.est_price_min))} – ${formatPln(Number(lead.est_price_max || 0))}`
                  : "—"
              }
            />
          </dl>
          {lead.project_file_url ? (
            <a
              href={lead.project_file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-[var(--rf-accent)] hover:underline"
            >
              Pobierz załączony projekt
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
