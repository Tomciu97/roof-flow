"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPln } from "@/lib/calculator";
import { ROOF_TYPE_LABELS } from "@/lib/constants";
import type { Lead, LeadStatus, RoofType } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function LeadsTable({
  leads,
  statusLabels,
  demo,
}: {
  leads: Lead[];
  statusLabels: Record<LeadStatus, string>;
  demo?: boolean;
}) {
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () =>
      status === "all" ? leads : leads.filter((l) => l.status === status),
    [leads, status]
  );

  async function updateStatus(id: string, next: LeadStatus) {
    if (demo) return;
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    window.location.reload();
  }

  function workType(l: Lead) {
    const parts = ["Dach"];
    if (l.insulation_area_m2) parts.push("Poddasze");
    if (l.facade_area_m2) parts.push("Elewacja");
    return parts.join(" / ");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">CRM leadów</h2>
        <Select
          className="w-auto min-w-[180px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Wszystkie statusy</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      {demo ? (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Podgląd demo — po podłączeniu Supabase zobaczysz prawdziwe leady.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[var(--rf-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--rf-border)] bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Klient</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Miejscowość</th>
              <th className="px-4 py-3 font-medium">Rodzaj prac</th>
              <th className="px-4 py-3 font-medium">Budżet</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[var(--rf-muted)]"
                >
                  Brak leadów w wybranym filtrze.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-[var(--rf-border)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/leady/${l.id}`}
                      className="font-medium text-[var(--rf-accent)] hover:underline"
                    >
                      {l.client_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {l.roof_type
                        ? ROOF_TYPE_LABELS[l.roof_type as RoofType] ||
                          l.roof_type
                        : "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${l.client_phone}`} className="hover:underline">
                      {l.client_phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">{l.location || "—"}</td>
                  <td className="px-4 py-3">{workType(l)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.est_price_min
                      ? `${formatPln(Number(l.est_price_min))} – ${formatPln(Number(l.est_price_max || 0))}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      className="h-9 min-w-[150px] text-xs"
                      value={l.status}
                      onChange={(e) =>
                        updateStatus(l.id, e.target.value as LeadStatus)
                      }
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {format(new Date(l.created_at), "d MMM yyyy", {
                      locale: pl,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
