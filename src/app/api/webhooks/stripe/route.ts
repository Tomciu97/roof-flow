import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Brak konfiguracji webhooka" },
      { status: 400 }
    );
  }

  const raw = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nieprawidłowy podpis" },
      { status: 400 }
    );
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === "b2c_report") {
        await supabase
          .from("b2c_orders")
          .update({
            status: "paid",
            amount_paid: (session.amount_total || 0) / 100,
          })
          .eq("stripe_session_id", session.id);
      }
      if (session.metadata?.type === "b2b_subscription" && session.subscription) {
        const plan = session.metadata.plan || "starter";
        const insulation =
          plan === "pro" || session.metadata.insulation === "true";
        const facade = plan === "pro" || session.metadata.facade === "true";
        await supabase
          .from("tenants")
          .update({
            stripe_subscription_id: String(session.subscription),
            stripe_customer_id: String(session.customer || ""),
            subscription_status: "trialing",
            plan_tier: plan,
            has_insulation_addon: insulation,
            has_facade_addon: facade,
          })
          .eq("user_id", session.metadata.user_id);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status;
      await supabase
        .from("tenants")
        .update({
          subscription_status: status,
          plan_tier:
            status === "canceled" || status === "unpaid"
              ? "starter"
              : undefined,
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
