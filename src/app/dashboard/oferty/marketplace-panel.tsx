"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPln } from "@/lib/calculator";

type TenantProps = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  postalCode: string;
  plan: "starter" | "pro";
};

type MarketItem = {
  request: {
    id: string;
    clientName: string;
    clientPhone: string;
    city: string;
    postalCode: string;
    schedule: string;
    result: { priceMin: number; priceMax: number; roofAreaWithWasteM2: number };
    amountPaid: number;
    createdAt: string;
  };
  matchReason: string;
  matchLabel: string;
  offersCount: number;
};

export function MarketplacePanel({ tenant }: { tenant: TenantProps }) {
  const [city, setCity] = useState(tenant.city);
  const [postalCode, setPostalCode] = useState(tenant.postalCode);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingLoc, setSavingLoc] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [materialsNote, setMaterialsNote] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        for_company: "1",
        city,
        postal: postalCode,
      });
      const res = await fetch(`/api/marketplace?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd pobierania");
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }, [city, postalCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setSavingLoc(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_location",
          city,
          postalCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie zapisano lokalizacji");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd lokalizacji");
    } finally {
      setSavingLoc(false);
    }
  }

  async function submitOffer(requestId: string) {
    const priceOffered = Number(price.replace(/\s/g, "").replace(",", "."));
    if (!priceOffered || priceOffered < 1000) {
      setError("Podaj sensowną kwotę oferty (np. 48000).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          tenantPhone: tenant.phone,
          tenantCity: city,
          tenantPostal: postalCode,
          priceOffered,
          message,
          materialsNote,
          scheduleNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie złożono oferty");
      setActiveId(null);
      setPrice("");
      setMessage("");
      setMaterialsNote("");
      setScheduleNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd oferty");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={saveLocation}
        className="rounded-2xl border border-[var(--rf-border)] bg-white p-5"
      >
        <h2 className="font-display text-lg font-semibold">
          Siedziba firmy (zasięg marketplace)
        </h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Widzisz zapytania z tego samego miasta lub regionu pocztowego (pierwsze
          2 cyfry kodu).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="co-city">Miasto</Label>
            <Input
              id="co-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="co-postal">Kod pocztowy</Label>
            <Input
              id="co-postal"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="30-001"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={savingLoc} className="w-full">
              {savingLoc ? "Zapisywanie…" : "Zapisz i odśwież"}
            </Button>
          </div>
        </div>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">
            Nowe zapytania w okolicy
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Odśwież
          </Button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--rf-muted)]">Ładowanie…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--rf-border)] bg-white px-4 py-8 text-sm text-[var(--rf-muted)]">
            Brak otwartych zapytań w Twoim regionie. Gdy inwestor z okolicy kupi
            wycenę (59–87 zł), pojawi się tu — wtedy możesz zaproponować cenę.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map(({ request, matchLabel, offersCount }) => (
              <li
                key={request.id}
                className="rounded-2xl border border-[var(--rf-border)] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Nowy klient w okolicy
                    </p>
                    <p className="mt-1 font-semibold">{request.clientName}</p>
                    <p className="text-sm text-[var(--rf-muted)]">
                      {request.postalCode} {request.city}
                      {request.schedule ? ` · termin: ${request.schedule}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-teal-800">{matchLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--rf-muted)]">
                      Widełki z raportu
                    </p>
                    <p className="font-display text-xl font-semibold">
                      {formatPln(request.result.priceMin)} –{" "}
                      {formatPln(request.result.priceMax)}
                    </p>
                    <p className="text-xs text-slate-500">
                      ~{Math.round(request.result.roofAreaWithWasteM2)} m² dachu ·{" "}
                      {offersCount}{" "}
                      {offersCount === 1 ? "oferta" : "ofert"} firm
                    </p>
                  </div>
                </div>

                {activeId === request.id ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--rf-border)] pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`price-${request.id}`}>
                          Twoja cena (zł)
                        </Label>
                        <Input
                          id={`price-${request.id}`}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder={String(
                            Math.round(request.result.priceMin * 0.95)
                          )}
                          inputMode="decimal"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`sched-${request.id}`}>
                          Proponowany termin
                        </Label>
                        <Input
                          id={`sched-${request.id}`}
                          value={scheduleNote}
                          onChange={(e) => setScheduleNote(e.target.value)}
                          placeholder="np. start za 3 tygodnie"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor={`mat-${request.id}`}>
                          Materiały / wariant
                        </Label>
                        <Input
                          id={`mat-${request.id}`}
                          value={materialsNote}
                          onChange={(e) => setMaterialsNote(e.target.value)}
                          placeholder="np. blachodachówka zamiast ceramicznej"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor={`msg-${request.id}`}>Wiadomość</Label>
                        <Input
                          id={`msg-${request.id}`}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Krótko dlaczego warto wybrać Waszą firmę"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => submitOffer(request.id)}
                      >
                        {submitting ? "Wysyłanie…" : "Wyślij ofertę klientowi"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveId(null)}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setActiveId(request.id);
                        setPrice(
                          String(Math.round(request.result.priceMin * 0.95))
                        );
                      }}
                    >
                      Zaproponuj cenę
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
