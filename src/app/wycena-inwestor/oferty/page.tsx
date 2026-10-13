import Link from "next/link";
import { Suspense } from "react";
import { OffersClient } from "./offers-client";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oferty firm z okolicy",
};

export const instant = false;

export default function OfertyPage() {
  return (
    <div className="min-h-screen rf-grain">
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <Link href="/" className="font-display text-xl font-semibold">
          {APP_NAME}
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold">
          Oferty firm z Twojej okolicy
        </h1>
        <p className="mt-2 text-[var(--rf-muted)]">
          Porównaj propozycje, akceptuj lub odrzucaj. Firmy widzą Twoje
          zapytanie dzięki kodowi pocztowemu i miastu.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p>Ładowanie ofert…</p>}>
            <OffersClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
