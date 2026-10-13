"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPln } from "@/lib/calculator";

type Offer = {
  id: string;
  tenantName: string;
  tenantPhone: string;
  tenantCity: string;
  priceOffered: number;
  message: string;
  materialsNote: string;
  scheduleNote: string;
  status: "pending" | "accepted" | "rejected";
};

type Payload = {
  request: {
    id: string;
    city: string;
    postalCode: string;
    schedule: string;
    result: { priceMin: number; priceMax: number };
  };
  matchedCompanies: { id: string; name: string; city: string; matchLabel: string }[];
  offers: Offer[];
};

export function OffersClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    if (!sessionId) {
      setError("Brak session_id — wróć ze strony sukcesu płatności.");
      return;
    }
    const res = await fetch(
      `/api/marketplace?session_id=${encodeURIComponent(sessionId)}`
    );
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Nie udało się pobrać ofert");
      return;
    }
    setData(json);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function setStatus(offerId: string, status: "accepted" | "rejected") {
    setBusy(offerId);
    try {
      const res = await fetch("/api/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Błąd");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) {
    return (
      <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-[var(--rf-muted)]">Ładowanie…</p>;
  }

  const { request, matchedCompanies, offers } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-5">
        <p className="text-sm text-[var(--rf-muted)]">
          Twoja lokalizacja:{" "}
          <strong>
            {request.postalCode} {request.city}
          </strong>
          {request.schedule ? ` · termin: ${request.schedule}` : ""}
        </p>
        <p className="mt-2 font-display text-xl font-semibold">
          Widełki z raportu: {formatPln(request.result.priceMin)} –{" "}
          {formatPln(request.result.priceMax)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {matchedCompanies.length} firm w zasięgu może złożyć ofertę.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">Otrzymane oferty</h2>
        {offers.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-[var(--rf-border)] bg-white px-4 py-6 text-sm text-[var(--rf-muted)]">
            Na razie brak ofert. Firmy z okolicy właśnie dostały powiadomienie o
            Twoim zapytaniu — odśwież tę stronę za chwilę.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {offers.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-[var(--rf-border)] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o.tenantName}</p>
                    <p className="text-sm text-[var(--rf-muted)]">
                      {o.tenantCity}
                      {o.tenantPhone ? ` · ${o.tenantPhone}` : ""}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-semibold">
                    {formatPln(o.priceOffered)}
                  </p>
                </div>
                {o.message ? (
                  <p className="mt-3 text-sm">{o.message}</p>
                ) : null}
                {o.materialsNote ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Materiały: {o.materialsNote}
                  </p>
                ) : null}
                {o.scheduleNote ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Termin: {o.scheduleNote}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status:{" "}
                  {o.status === "pending"
                    ? "oczekuje"
                    : o.status === "accepted"
                      ? "zaakceptowana"
                      : "odrzucona"}
                </p>
                {o.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => setStatus(o.id, "accepted")}
                    >
                      Akceptuj ofertę
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy === o.id}
                      onClick={() => setStatus(o.id, "rejected")}
                    >
                      Odrzuć
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">
          Firmy powiadomione o zapytaniu
        </h2>
        <ul className="mt-3 space-y-2">
          {matchedCompanies.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[var(--rf-border)] bg-white px-4 py-3 text-sm"
            >
              <strong>{c.name}</strong> · {c.city}
              <span className="block text-xs text-[var(--rf-muted)]">
                {c.matchLabel}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
