"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    sessionId ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    sessionId ? "" : "Brak identyfikatora sesji Stripe."
  );

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    fetch(`/api/generate-pdf?session_id=${encodeURIComponent(sessionId)}`, {
      method: "POST",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Błąd generowania PDF");
        if (cancelled) return;
        setStatus("ok");
        setMessage(
          data.emailSent ? "Raport wysłany na e-mail." : "Raport gotowy."
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="mt-10">
        <h1 className="font-display text-3xl font-semibold">Dziękujemy!</h1>
        <p className="mt-3 text-[var(--rf-muted)]">
          Weryfikujemy płatność i generujemy raport PDF…
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

  return (
    <div className="mt-10">
      <h1 className="font-display text-3xl font-semibold">Płatność potwierdzona</h1>
      <p className="mt-3 text-[var(--rf-muted)]">{message}</p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <a href={`/api/generate-pdf?session_id=${sessionId}&download=1`}>
          <Button>Pobierz raport PDF</Button>
        </a>
        <Link href="/" className="text-sm text-[var(--rf-accent)] hover:underline">
          Wróć na stronę główną
        </Link>
      </div>
    </div>
  );
}
