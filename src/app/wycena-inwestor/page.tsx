import Link from "next/link";
import { CalculatorWizard } from "@/components/calculator/wizard";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wycena inwestorska z raportem PDF",
  description:
    "Jednorazowy kalkulator dachu, poddasza i elewacji. Zapłać 59–87 zł i pobierz raport PDF.",
};

export const instant = false;

export default function WycenaInwestorPage() {
  return (
    <div className="min-h-screen rf-grain">
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-[var(--rf-ink)]"
        >
          {APP_NAME}
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold md:text-4xl">
          Szybka wycena inwestorska
        </h1>
        <p className="mt-2 text-[var(--rf-muted)]">
          Bez konta. Po płatności otrzymasz raport PDF z wykazem kosztów.
        </p>
        <div className="mt-8">
          <CalculatorWizard mode="b2c" />
        </div>
      </div>
    </div>
  );
}
