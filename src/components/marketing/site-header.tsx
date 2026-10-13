import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-[var(--rf-ink)]"
        >
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
          <a href="#funkcje" className="hover:text-[var(--rf-accent)]">
            Dla firm
          </a>
          <a href="#inwestorzy" className="hover:text-[var(--rf-accent)]">
            Dla inwestorów
          </a>
          <a href="#cennik" className="hover:text-[var(--rf-accent)]">
            Cennik
          </a>
          <Link href="/login" className="hover:text-[var(--rf-accent)]">
            Logowanie
          </Link>
        </nav>
        <Link
          href="/rejestracja-b2b"
          className="rounded-lg bg-[var(--rf-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          14 dni gratis
        </Link>
      </div>
    </header>
  );
}
