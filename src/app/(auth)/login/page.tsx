import { Suspense } from "react";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-6 shadow-sm md:p-8">
      <h1 className="font-display text-2xl font-semibold">Logowanie</h1>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">
        Panel wykonawcy RoofFlow
      </p>
      <Suspense fallback={<p className="mt-6 text-sm">Ładowanie…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
