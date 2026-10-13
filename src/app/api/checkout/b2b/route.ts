import { NextResponse } from "next/server";
import { getB2BPriceId, getStripe } from "@/lib/stripe";
import { APP_URL, B2B_PRICES } from "@/lib/constants";
import { computeB2BMonthly } from "@/lib/plans";
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
    const insulation = plan === "pro" ? true : Boolean(body.insulation);
    const facade = plan === "pro" ? true : Boolean(body.facade);
    const pricing = computeB2BMonthly({
      plan,
      addons: { insulation, facade },
    });

    if (
      !process.env.STRIPE_SECRET_KEY ||
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_")
    ) {
      return NextResponse.json({
        url: `${APP_URL}/dashboard?plan=${plan}&trial=1&insulation=${insulation ? 1 : 0}&facade=${facade ? 1 : 0}`,
        demo: true,
        monthlyTotal: pricing.total,
        message:
          "Stripe nie jest skonfigurowany. Ustaw STRIPE_SECRET_KEY oraz Price ID (STRIPE_PRICE_B2B_*), aby uruchomić Checkout z trialem 14 dni.",
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
      insulation: plan === "starter" && insulation,
      facade: plan === "starter" && facade,
    });

    const line_items: {
      price?: string;
      price_data?: object;
      quantity: number;
    }[] = [];

    if (prices.main) {
      line_items.push({ price: prices.main, quantity: 1 });
      // Gotowe Price ID add-onów — pełna cena; promocję −50% rozliczamy
      // przez price_data gdy brak osobnego Price ID promocji.
      if (prices.addons.length && !pricing.bundlePromo) {
        for (const addon of prices.addons) {
          line_items.push({ price: addon, quantity: 1 });
        }
      } else if (plan === "starter") {
        appendAddonPriceData(line_items, pricing, insulation, facade);
      }
    } else {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "pln",
          unit_amount: Math.round(pricing.base * 100),
          recurring: { interval: "month" },
          product_data: {
            name:
              plan === "pro" ? "RoofFlow PRO ALL-IN-ONE" : "RoofFlow STARTER",
          },
        },
      });
      if (plan === "starter") {
        appendAddonPriceData(line_items, pricing, insulation, facade);
      }
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
          insulation: String(insulation),
          facade: String(facade),
          tenant_id: tenant?.id || "",
        },
      },
      success_url: `${APP_URL}/dashboard?subskrypcja=ok`,
      cancel_url: `${APP_URL}/dashboard/platnosci?anulowano=1`,
      metadata: {
        type: "b2b_subscription",
        plan,
        user_id: user.id,
        insulation: String(insulation),
        facade: String(facade),
      },
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

function appendAddonPriceData(
  line_items: { price_data?: object; quantity: number }[],
  pricing: ReturnType<typeof computeB2BMonthly>,
  insulation: boolean,
  facade: boolean
) {
  if (insulation && pricing.insulationPrice > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(pricing.insulationPrice * 100),
        recurring: { interval: "month" },
        product_data: { name: "RoofFlow Add-on Poddasze" },
      },
    });
  }
  if (facade && pricing.facadePrice > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(pricing.facadePrice * 100),
        recurring: { interval: "month" },
        product_data: {
          name: pricing.bundlePromo
            ? "RoofFlow Add-on Elewacja (−50% pakiet)"
            : "RoofFlow Add-on Elewacja",
        },
      },
    });
  }
}
