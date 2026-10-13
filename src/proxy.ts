import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { APP_DOMAIN } from "@/lib/constants";
import { extractSubdomain, isRootDomainHost } from "@/lib/utils";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || APP_DOMAIN;

  // Odśwież sesję Supabase Auth
  const response = await updateSession(request);

  // Subdomena najemcy → rewrite na /firmy/[slug]
  const subdomain = extractSubdomain(host, rootDomain);
  if (subdomain && !pathname.startsWith("/firmy/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/firmy/${subdomain}${pathname === "/" ? "" : pathname}`;
    const rewrite = NextResponse.rewrite(url);
    response.cookies.getAll().forEach((c) => {
      rewrite.cookies.set(c.name, c.value);
    });
    return rewrite;
  }

  // Własna domena klienta (PRO) — nagłówek x-tenant-domain
  if (!isRootDomainHost(host, rootDomain) && !subdomain) {
    const cleanHost = host.split(":")[0].toLowerCase();
    if (
      !cleanHost.includes("localhost") &&
      !cleanHost.endsWith(".vercel.app")
    ) {
      response.headers.set("x-tenant-domain", cleanHost);
      if (!pathname.startsWith("/firmy/") && !pathname.startsWith("/api/")) {
        // Lookup odbywa się po stronie page przez custom_domain;
        // tu oznaczamy request i opcjonalnie rewrite przez API mapa.
        const mapUrl = request.nextUrl.clone();
        mapUrl.pathname = `/api/tenant/resolve`;
        // Nie blokujemy — dashboard i API działają normalnie.
      }
    }
  }

  // Ochrona dashboardu — sesja demo LUB Supabase
  if (pathname.startsWith("/dashboard")) {
    const hasDemo = request.cookies.has("rf_demo_session");
    const hasSupabaseSession = request.cookies
      .getAll()
      .some(
        (c) =>
          c.name.includes("auth-token") ||
          c.name.startsWith("sb-") ||
          c.name.includes("supabase")
      );
    const supabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
    );

    // Bez żadnej sesji: w trybie demo (bez Supabase) wpuszczamy;
    // ze skonfigurowanym Supabase wymagamy logowania.
    if (supabaseConfigured && !hasDemo && !hasSupabaseSession) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
