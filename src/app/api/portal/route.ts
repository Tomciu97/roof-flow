import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/constants";

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe nie jest skonfigurowany" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tenant?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Brak klienta Stripe — wykup subskrypcję." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/platnosci`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd portalu" },
      { status: 500 }
    );
  }
}
