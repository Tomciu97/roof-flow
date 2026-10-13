import Link from "next/link";
import { Suspense } from "react";
import { SuccessClient } from "./success-client";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Płatność zakończona",
};

export const instant = false;

export default function SukcesPage() {
  return (
    <div className="min-h-screen rf-grain">
      <div className="mx-auto max-w-xl px-5 py-16 text-center md:px-8">
        <Link href="/" className="font-display text-xl font-semibold">
          {APP_NAME}
        </Link>
        <Suspense
          fallback={
            <p className="mt-10 text-[var(--rf-muted)]">Weryfikacja płatności…</p>
          }
        >
          <SuccessClient />
        </Suspense>
      </div>
    </div>
  );
}
