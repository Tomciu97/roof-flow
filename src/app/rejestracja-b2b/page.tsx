import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "./register-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejestracja wykonawcy — 14 dni gratis",
};

export const instant = false;

export default function RejestracjaB2BPage() {
  return (
    <div className="min-h-screen rf-grain">
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <Link
          href="/"
          className="font-display text-2xl font-semibold md:text-3xl"
        >
          {APP_NAME}
        </Link>
        <div className="mt-8">
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Załóż konto wykonawcy
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--rf-muted)]">
            Wybierz plan, zobacz dokładnie co kupujesz i wejdź do panelu w trybie
            demonstracyjnym — bez karty. Stripe podłączysz, gdy będziesz gotowy.
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-[var(--rf-border)] bg-white/90 p-5 shadow-sm md:p-8">
          <Suspense fallback={<p>Ładowanie…</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
