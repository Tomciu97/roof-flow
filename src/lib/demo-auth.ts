export const DEMO_COOKIE = "rf_demo_session";
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export type DemoSession = {
  mode: "demo";
  company: string;
  slug: string;
  email: string;
  plan: "starter" | "pro";
  phone?: string;
  city?: string;
  postalCode?: string;
  serviceRadiusKm?: number;
  /** Add-ony STARTER (w PRO zawsze true) */
  insulationAddon?: boolean;
  facadeAddon?: boolean;
  billingInterval?: "month" | "year";
  createdAt: string;
};

export function encodeDemoSession(session: DemoSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeDemoSession(raw: string | undefined | null): DemoSession | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as DemoSession;
    if (data?.mode !== "demo" || !data.company) return null;
    return data;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY.startsWith("sk_")
  );
}
