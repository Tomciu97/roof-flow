import { NextResponse } from "next/server";
import { generateReportPdf } from "@/lib/pdf";
import { calculateFromWizard } from "@/lib/calculator";
import { sendInvestorReportEmail } from "@/lib/email";
import { DEFAULT_WIZARD_STATE } from "@/lib/constants";
import type { CalculationBreakdown, WizardState } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const download = searchParams.get("download");

  if (!sessionId) {
    return NextResponse.json({ error: "Brak session_id" }, { status: 400 });
  }

  const order = await loadOrder(sessionId);
  if (!order && !sessionId.startsWith("mock_")) {
    return NextResponse.json({ error: "Nie znaleziono zamówienia" }, { status: 404 });
  }

  const state = (order?.state || DEFAULT_WIZARD_STATE) as WizardState;
  const result =
    (order?.result as CalculationBreakdown) || calculateFromWizard(state);

  const pdf = await generateReportPdf({ state, result });

  if (download) {
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="raport-roofflow.pdf"',
      },
    });
  }

  return NextResponse.json({ ok: true, bytes: pdf.length });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  let sessionId = searchParams.get("session_id");

  if (!sessionId) {
    try {
      const body = await request.json();
      sessionId = body.session_id;
    } catch {
      /* empty */
    }
  }

  if (!sessionId) {
    return NextResponse.json({ error: "Brak session_id" }, { status: 400 });
  }

  // Weryfikacja Stripe (pomijana dla mock_)
  if (!sessionId.startsWith("mock_") && process.env.STRIPE_SECRET_KEY) {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "Płatność nie została potwierdzona" },
        { status: 402 }
      );
    }
  }

  const order = await loadOrder(sessionId);
  const state = (order?.state || {
    ...DEFAULT_WIZARD_STATE,
    email: order?.email || "klient@example.pl",
  }) as WizardState;
  const result =
    (order?.result as CalculationBreakdown) || calculateFromWizard(state);

  const pdf = await generateReportPdf({ state, result });

  let emailSent = false;
  if (state.email) {
    const mail = await sendInvestorReportEmail({
      to: state.email,
      pdfBuffer: pdf,
      priceMin: result.priceMin,
      priceMax: result.priceMax,
    });
    emailSent = !("skipped" in mail && mail.skipped);
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && !sessionId.startsWith("mock_")) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = await createServiceClient();
      await supabase
        .from("b2c_orders")
        .update({ status: "paid" })
        .eq("stripe_session_id", sessionId);
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}

async function loadOrder(sessionId: string): Promise<{
  state?: WizardState;
  result?: CalculationBreakdown;
  email?: string;
} | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("b2c_orders")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (!data) return null;
    const calc = data.calculation_data as {
      state?: WizardState;
      result?: CalculationBreakdown;
    };
    return {
      state: calc?.state,
      result: calc?.result,
      email: data.client_email,
    };
  } catch {
    return null;
  }
}
