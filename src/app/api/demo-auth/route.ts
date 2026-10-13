import { NextResponse } from "next/server";
import {
  DEMO_COOKIE,
  decodeDemoSession,
  encodeDemoSession,
  type DemoSession,
} from "@/lib/demo-auth";
import { formatPostal, isValidPostal } from "@/lib/location";
import { upsertCompany } from "@/lib/marketplace-store";
import { slugify } from "@/lib/utils";

function cookieValue(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") || "";
  const match = raw
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action as
    | "login"
    | "register"
    | "logout"
    | "update_location";

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  if (action === "update_location") {
    const existing = decodeDemoSession(cookieValue(request, DEMO_COOKIE));
    if (!existing) {
      return NextResponse.json(
        { error: "Brak sesji — zaloguj się ponownie." },
        { status: 401 }
      );
    }
    const city = String(body.city || "").trim();
    const postalCode = formatPostal(String(body.postalCode || ""));
    if (!city || !isValidPostal(postalCode)) {
      return NextResponse.json(
        { error: "Podaj miasto i poprawny kod pocztowy (np. 30-001)." },
        { status: 400 }
      );
    }
    const serviceRadiusKm = Number(body.serviceRadiusKm) || existing.serviceRadiusKm || 50;
    const session: DemoSession = {
      ...existing,
      city,
      postalCode,
      serviceRadiusKm,
    };
    syncCompany(session);
    const res = NextResponse.json({ ok: true, session });
    res.cookies.set(DEMO_COOKIE, encodeDemoSession(session), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  const company =
    String(body.company || "").trim() || "Demo Dekarz Marian";
  const email = String(body.email || "demo@roofflow.pl").trim();
  const plan = body.plan === "pro" ? "pro" : "starter";
  const phone = body.phone ? String(body.phone) : undefined;
  const slug = slugify(company) || "dekarz-marian";

  const city = String(body.city || "").trim() || "Kraków";
  const postalCode = formatPostal(
    String(body.postalCode || body.postal || "").trim() || "30-001"
  );
  if (body.city || body.postalCode || body.postal) {
    if (!isValidPostal(postalCode)) {
      return NextResponse.json(
        { error: "Podaj poprawny kod pocztowy siedziby (np. 30-001)." },
        { status: 400 }
      );
    }
  }
  const serviceRadiusKm = Number(body.serviceRadiusKm) || 50;

  const session: DemoSession = {
    mode: "demo",
    company,
    slug,
    email,
    plan,
    phone,
    city,
    postalCode,
    serviceRadiusKm,
    createdAt: new Date().toISOString(),
  };

  syncCompany(session);

  const res = NextResponse.json({
    ok: true,
    session,
    redirect:
      action === "register" && body.checkout
        ? `/api/checkout/b2b?demo=1&plan=${plan}`
        : "/dashboard",
  });

  res.cookies.set(DEMO_COOKIE, encodeDemoSession(session), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
  });

  return res;
}

function syncCompany(session: DemoSession) {
  upsertCompany({
    id: `demo-${session.slug}`,
    name: session.company,
    slug: session.slug,
    phone: session.phone || "",
    city: session.city || "",
    postalCode: session.postalCode || "",
    plan: session.plan,
    brandColor: "#0f766e",
  });
}
