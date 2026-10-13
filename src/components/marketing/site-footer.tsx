import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--rf-border)] bg-[#0b1f1c] text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <p className="font-display text-2xl text-white">{APP_NAME}</p>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Platforma wycen dachu, ocieplenia poddasza i elewacji dla inwestorów
            oraz firm dekarskich.
          </p>
        </div>
        <div className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <Link href="/wycena-inwestor" className="hover:text-white">
              Wycena inwestorska
            </Link>
            <Link href="/rejestracja-b2b" className="hover:text-white">
              Rejestracja B2B
            </Link>
            <Link href="/login" className="hover:text-white">
              Panel firmy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © 2026 {APP_NAME}. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  );
}
