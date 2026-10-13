import Link from "next/link";
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <Link
          href="/"
          className="mb-8 text-center font-display text-3xl font-semibold"
        >
          {APP_NAME}
        </Link>
        <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-6 shadow-sm md:p-8">
          <h1 className="font-display text-2xl font-semibold">
            Rejestracja wykonawcy
          </h1>
          <p className="mt-1 text-sm text-[var(--rf-muted)]">
            14 dni za darmo. Po rejestracji wybierzesz plan Stripe.
          </p>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
