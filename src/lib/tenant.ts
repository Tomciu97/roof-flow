import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_COOKIE,
  decodeDemoSession,
  isSupabaseConfigured,
  type DemoSession,
} from "@/lib/demo-auth";
import type { PricingConfig, Tenant } from "@/lib/types";

export async function getCurrentTenant(): Promise<{
  tenant: Tenant | null;
  pricing: PricingConfig | null;
  userId: string | null;
  isDemo: boolean;
}> {
  // Najpierw sesja demonstracyjna (do klikania bez Supabase)
  try {
    const cookieStore = await cookies();
    const demo = decodeDemoSession(cookieStore.get(DEMO_COOKIE)?.value);
    if (demo) {
      return {
        tenant: tenantFromDemo(demo),
        pricing: null,
        userId: "demo",
        isDemo: true,
      };
    }
  } catch {
    /* cookies() może być niedostępne w niektórych kontekstach */
  }

  if (!isSupabaseConfigured()) {
    return { tenant: null, pricing: null, userId: null, isDemo: false };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { tenant: null, pricing: null, userId: null, isDemo: false };
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tenant) {
      return { tenant: null, pricing: null, userId: user.id, isDemo: false };
    }

    const { data: pricing } = await supabase
      .from("pricing_configs")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    return {
      tenant: tenant as Tenant,
      pricing: (pricing as PricingConfig) || null,
      userId: user.id,
      isDemo: false,
    };
  } catch {
    return { tenant: null, pricing: null, userId: null, isDemo: false };
  }
}

function tenantFromDemo(demo: DemoSession): Tenant {
  const isPro = demo.plan === "pro";
  return {
    id: `demo-${demo.slug}`,
    user_id: "demo",
    name: demo.company,
    slug: demo.slug,
    logo_url: null,
    brand_color: "#0f766e",
    phone: demo.phone || "+48 500 100 200",
    city: demo.city || "Kraków",
    postal_code: demo.postalCode || "30-001",
    service_radius_km: demo.serviceRadiusKm ?? 50,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "trialing",
    plan_tier: demo.plan,
    has_insulation_addon: isPro,
    has_facade_addon: isPro,
    custom_domain: null,
    created_at: demo.createdAt,
  };
}

export function demoTenant(): Tenant {
  return {
    id: "demo-dekarz-marian",
    user_id: "demo",
    name: "Demo Dekarz Marian",
    slug: "dekarz-marian",
    logo_url: null,
    brand_color: "#0f766e",
    phone: "+48 500 100 200",
    city: "Kraków",
    postal_code: "30-001",
    service_radius_km: 50,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "trialing",
    plan_tier: "starter",
    has_insulation_addon: false,
    has_facade_addon: false,
    custom_domain: null,
    created_at: new Date().toISOString(),
  };
}
