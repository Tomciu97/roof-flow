"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Puzzle,
  CreditCard,
  LogOut,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Leady", icon: LayoutDashboard },
  { href: "/dashboard/cennik", label: "Cennik", icon: Tags },
  { href: "/dashboard/widget", label: "Widget", icon: Puzzle },
  { href: "/dashboard/platnosci", label: "Płatności", icon: CreditCard },
];

export function DashboardSidebar({ company }: { company: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex w-full flex-col border-b border-[var(--rf-border)] bg-[#0b1f1c] text-white md:min-h-screen md:w-64 md:border-b-0 md:border-r md:border-white/10">
      <div className="px-5 py-5">
        <Link href="/" className="font-display text-xl font-semibold">
          {APP_NAME}
        </Link>
        <p className="mt-1 truncate text-xs text-white/60">{company}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Wyloguj
      </button>
    </aside>
  );
}
