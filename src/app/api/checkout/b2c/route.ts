import { NextResponse } from "next/server";
import { getB2CLineItems, getStripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/constants";
import { resolveB2CAmount } from "@/lib/calculator";
import type { CalculationBreakdown, WizardState } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      state: WizardState;
      result: CalculationBreakdown;
    };

    if (!body?.state?.email) {
      return NextResponse.json(
        { error: "Podaj adres e-mail odbiorcy raportu." },
        { status: 400 }
      );
    }

    const amount = resolveB2CAmount(
      body.state.insulationEnabled,
      body.state.facadeEnabled
    );

    // Bez klucza Stripe — tryb lokalny z mock sesją
    if (!process.env.STRIPE_SECRET_KEY) {
      const mockId = `mock_${Date.now()}`;
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createServiceClient } = await import("@/lib/supabase/server");
        const supabase = await createServiceClient();
        await supabase.from("b2c_orders").insert({
          stripe_session_id: mockId,
          client_email: body.state.email,
          calculation_data: { state: body.state, result: body.result },
          amount_paid: amount,
          status: "paid",
        });
      }
      return NextResponse.json({
        url: `${APP_URL}/wycena-inwestor/sukces?session_id=${mockId}`,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.state.email,
      line_items: getB2CLineItems(
        body.state.insulationEnabled,
        body.state.facadeEnabled
      ),
      success_url: `${APP_URL}/wycena-inwestor/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/wycena-inwestor?anulowano=1`,
      metadata: {
        type: "b2c_report",
        insulation: String(body.state.insulationEnabled),
        facade: String(body.state.facadeEnabled),
      },
    });

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = await createServiceClient();
      await supabase.from("b2c_orders").insert({
        stripe_session_id: session.id,
        client_email: body.state.email,
        calculation_data: { state: body.state, result: body.result },
        amount_paid: amount,
        status: "pending",
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd checkout" },
      { status: 500 }
    );
  }
}
