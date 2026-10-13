import { NextResponse } from "next/server";
import {
  DEMO_COOKIE,
  encodeDemoSession,
  type DemoSession,
} from "@/lib/demo-auth";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action as "login" | "register" | "logout";

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  const company =
    String(body.company || "").trim() || "Demo Dekarz Marian";
  const email = String(body.email || "demo@roofflow.pl").trim();
  const plan = body.plan === "pro" ? "pro" : "starter";
  const phone = body.phone ? String(body.phone) : undefined;
  const slug = slugify(company) || "dekarz-marian";

  const session: DemoSession = {
    mode: "demo",
    company,
    slug,
    email,
    plan,
    phone,
    createdAt: new Date().toISOString(),
  };

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
