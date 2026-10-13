import { NextResponse } from "next/server";
import { getB2CLineItems, getStripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/constants";
import { resolveB2CAmount } from "@/lib/calculator";
import { formatPostal, isValidPostal } from "@/lib/location";
import { createMarketplaceRequest } from "@/lib/marketplace-store";
import type { CalculationBreakdown, WizardState } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      state: WizardState;
      result: CalculationBreakdown;
    };

    const state = body?.state;
    if (!state?.email) {
      return NextResponse.json(
        { error: "Podaj adres e-mail odbiorcy raportu." },
        { status: 400 }
      );
    }
    if (!state.clientName?.trim() || !state.clientPhone?.trim()) {
      return NextResponse.json(
        { error: "Podaj imię, nazwisko i telefon." },
        { status: 400 }
      );
    }
    if (!state.city?.trim()) {
      return NextResponse.json(
        { error: "Podaj miasto — dopasujemy firmy z okolicy." },
        { status: 400 }
      );
    }
    const postal = formatPostal(state.postalCode || "");
    if (!isValidPostal(postal)) {
      return NextResponse.json(
        { error: "Podaj poprawny kod pocztowy (np. 30-001)." },
        { status: 400 }
      );
    }

    const amount = resolveB2CAmount(
      state.insulationEnabled,
      state.facadeEnabled
    );

    const normalizedState = { ...state, postalCode: postal };

    // Bez klucza Stripe — mock + marketplace od razu
    if (
      !process.env.STRIPE_SECRET_KEY ||
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_")
    ) {
      const mockId = `mock_${Date.now()}`;
      createMarketplaceRequest({
        stripeSessionId: mockId,
        clientName: normalizedState.clientName,
        clientEmail: normalizedState.email,
        clientPhone: normalizedState.clientPhone,
        city: normalizedState.city,
        postalCode: postal,
        schedule: normalizedState.schedule || "",
        state: normalizedState,
        result: body.result,
        amountPaid: amount,
      });

      await persistOrderIfPossible({
        sessionId: mockId,
        state: normalizedState,
        result: body.result,
        amount,
        status: "paid",
      });

      return NextResponse.json({
        url: `${APP_URL}/wycena-inwestor/sukces?session_id=${mockId}`,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: normalizedState.email,
      line_items: getB2CLineItems(
        normalizedState.insulationEnabled,
        normalizedState.facadeEnabled
      ),
      success_url: `${APP_URL}/wycena-inwestor/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/wycena-inwestor?anulowano=1`,
      metadata: {
        type: "b2c_report",
        city: normalizedState.city,
        postal: postal,
        insulation: String(normalizedState.insulationEnabled),
        facade: String(normalizedState.facadeEnabled),
      },
    });

    // Pending order — marketplace tworzymy po webhooku / na stronie sukcesu
    await persistOrderIfPossible({
      sessionId: session.id,
      state: normalizedState,
      result: body.result,
      amount,
      status: "pending",
    });

    // Dla płynnego demo także przy Stripe test — request powstanie na sukcesie
    createMarketplaceRequest({
      stripeSessionId: session.id,
      clientName: normalizedState.clientName,
      clientEmail: normalizedState.email,
      clientPhone: normalizedState.clientPhone,
      city: normalizedState.city,
      postalCode: postal,
      schedule: normalizedState.schedule || "",
      state: normalizedState,
      result: body.result,
      amountPaid: amount,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd checkout" },
      { status: 500 }
    );
  }
}

async function persistOrderIfPossible(opts: {
  sessionId: string;
  state: WizardState;
  result: CalculationBreakdown;
  amount: number;
  status: "paid" | "pending";
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return;
  }
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    await supabase.from("b2c_orders").upsert(
      {
        stripe_session_id: opts.sessionId,
        client_email: opts.state.email,
        client_name: opts.state.clientName,
        client_phone: opts.state.clientPhone,
        client_city: opts.state.city,
        client_postal_code: opts.state.postalCode,
        client_schedule: opts.state.schedule,
        calculation_data: { state: opts.state, result: opts.result },
        amount_paid: opts.amount,
        status: opts.status,
      },
      { onConflict: "stripe_session_id" }
    );
  } catch (e) {
    console.warn("Nie zapisano b2c_order w Supabase", e);
  }
}
