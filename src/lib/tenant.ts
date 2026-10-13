import { createClient } from "@/lib/supabase/server";
import type { PricingConfig, Tenant } from "@/lib/types";

export async function getCurrentTenant(): Promise<{
  tenant: Tenant | null;
  pricing: PricingConfig | null;
  userId: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { tenant: null, pricing: null, userId: null };
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tenant) {
      return { tenant: null, pricing: null, userId: user.id };
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
    };
  } catch {
    return { tenant: null, pricing: null, userId: null };
  }
}

export function demoTenant(): Tenant {
  return {
    id: "demo",
    user_id: "demo",
    name: "Demo Dekarz Marian",
    slug: "dekarz-marian",
    logo_url: null,
    brand_color: "#0f766e",
    phone: "+48 500 100 200",
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
