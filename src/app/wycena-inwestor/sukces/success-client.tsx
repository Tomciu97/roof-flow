"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatPln } from "@/lib/calculator";

type MatchCompany = {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  phone: string;
  matchLabel: string;
};

type MarketplacePayload = {
  request: {
    id: string;
    city: string;
    postalCode: string;
    result: { priceMin: number; priceMax: number };
    amountPaid: number;
  };
  matchedCompanies: MatchCompany[];
  offers: unknown[];
};

export function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    sessionId ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    sessionId ? "" : "Brak identyfikatora sesji Stripe."
  );
  const [market, setMarket] = useState<MarketplacePayload | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const pdfRes = await fetch(
          `/api/generate-pdf?session_id=${encodeURIComponent(sessionId)}`,
          { method: "POST" }
        );
        const pdfData = await pdfRes.json();
        if (!pdfRes.ok) throw new Error(pdfData.error || "Błąd generowania PDF");

        const mRes = await fetch(
          `/api/marketplace?session_id=${encodeURIComponent(sessionId)}`
        );
        const mData = await mRes.json();
        if (cancelled) return;

        setStatus("ok");
        setMessage(
          pdfData.emailSent
            ? "Raport PDF wysłany na e-mail."
            : "Raport PDF gotowy do pobrania."
        );
        if (mRes.ok) setMarket(mData);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Błąd");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="mt-10 text-left">
        <h1 className="font-display text-3xl font-semibold">Dziękujemy!</h1>
        <p className="mt-3 text-[var(--rf-muted)]">
          Weryfikujemy płatność, generujemy raport i szukamy firm w Twojej
          okolicy…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-10">
        <h1 className="font-display text-3xl font-semibold">Wystąpił problem</h1>
        <p className="mt-3 text-rose-700">{message}</p>
        <Link href="/wycena-inwestor" className="mt-6 inline-block">
          <Button variant="outline">Wróć do wyceny</Button>
        </Link>
      </div>
    );
  }

  const companies = market?.matchedCompanies || [];
  const priceMin = market?.request?.result?.priceMin;
  const priceMax = market?.request?.result?.priceMax;

  return (
    <div className="mx-auto mt-8 max-w-2xl text-left">
      <h1 className="font-display text-3xl font-semibold">Płatność potwierdzona</h1>
      <p className="mt-2 text-[var(--rf-muted)]">{message}</p>

      {priceMin != null ? (
        <div className="mt-6 rounded-2xl border border-[var(--rf-border)] bg-white px-5 py-4">
          <p className="text-sm text-[var(--rf-muted)]">Szacunek z raportu</p>
          <p className="font-display text-2xl font-semibold">
            {formatPln(priceMin)} – {formatPln(priceMax || 0)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            To nie jest ostateczna oferta — lokalne firmy mogą zaproponować
            niższą lub wyższą cenę (inne materiały, termin, robocizna).
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 px-5 py-4">
        <h2 className="font-display text-xl font-semibold">
          Firmy w okolicy
          {market?.request
            ? ` · ${market.request.postalCode} ${market.request.city}`
            : ""}
        </h2>
        <p className="mt-1 text-sm text-teal-900/80">
          {companies.length > 0
            ? `${companies.length} ${
                companies.length === 1
                  ? "firma jest gotowa"
                  : companies.length < 5
                    ? "firmy są gotowe"
                    : "firm jest gotowych"
              } przyjąć Twoje zapytanie. Mogą się zgłosić z własną ofertą.`
            : "Szukamy firm w Twoim regionie — wróć za chwilę do panelu ofert."}
        </p>

        {companies.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {companies.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-teal-100 bg-white px-4 py-3"
              >
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-[var(--rf-muted)]">
                  {c.postalCode} {c.city}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-teal-800">{c.matchLabel}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={`/api/generate-pdf?session_id=${sessionId}&download=1`}>
          <Button className="w-full sm:w-auto">Pobierz raport PDF</Button>
        </a>
        <Link href={`/wycena-inwestor/oferty?session_id=${sessionId}`}>
          <Button variant="secondary" className="w-full sm:w-auto">
            Zobacz oferty firm
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto">
            Strona główna
          </Button>
        </Link>
      </div>
    </div>
  );
}
