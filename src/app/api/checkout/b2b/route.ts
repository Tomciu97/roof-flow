import { NextResponse } from "next/server";
import { getB2BPriceId, getStripe } from "@/lib/stripe";
import { APP_URL, B2B_PRICES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      plan: "starter" | "pro";
      slug?: string;
      insulation?: boolean;
      facade?: boolean;
    };

    const plan = body.plan || "starter";

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: `${APP_URL}/dashboard`,
        demo: true,
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Wymagane logowanie" }, { status: 401 });
    }

    const stripe = getStripe();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = tenant?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          user_id: user.id,
          slug: tenant?.slug || body.slug || "",
        },
      });
      customerId = customer.id;
      if (tenant) {
        await supabase
          .from("tenants")
          .update({ stripe_customer_id: customerId })
          .eq("id", tenant.id);
      }
    }

    const prices = getB2BPriceId(plan, {
      insulation: body.insulation,
      facade: body.facade,
    });

    const line_items: { price?: string; price_data?: object; quantity: number }[] =
      [];

    if (prices.main) {
      line_items.push({ price: prices.main, quantity: 1 });
      for (const addon of prices.addons) {
        line_items.push({ price: addon, quantity: 1 });
      }
    } else {
      const unit =
        plan === "pro" ? B2B_PRICES.pro * 100 : B2B_PRICES.starter * 100;
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "pln",
          unit_amount: unit,
          recurring: { interval: "month" },
          product_data: {
            name: plan === "pro" ? "RoofFlow PRO ALL-IN-ONE" : "RoofFlow STARTER",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: line_items as never,
      subscription_data: {
        trial_period_days: B2B_PRICES.trialDays,
        metadata: {
          user_id: user.id,
          plan,
          tenant_id: tenant?.id || "",
        },
      },
      success_url: `${APP_URL}/dashboard?subskrypcja=ok`,
      cancel_url: `${APP_URL}/dashboard/platnosci?anulowano=1`,
      metadata: { type: "b2b_subscription", plan, user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd checkout B2B" },
      { status: 500 }
    );
  }
}
