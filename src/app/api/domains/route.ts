import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addCustomDomain } from "@/lib/vercel-domains";

export async function POST(request: Request) {
  try {
    const { domain } = (await request.json()) as { domain: string };
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return NextResponse.json(
        { error: "Podaj poprawną domenę (np. kalkulator.firma.pl)" },
        { status: 400 }
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
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "Brak profilu firmy" }, { status: 404 });
    }

    if (tenant.plan_tier !== "pro") {
      return NextResponse.json(
        { error: "Własna domena wymaga planu PRO" },
        { status: 403 }
      );
    }

    const vercelResult = await addCustomDomain(domain.toLowerCase());

    await supabase
      .from("tenants")
      .update({ custom_domain: domain.toLowerCase() })
      .eq("id", tenant.id);

    return NextResponse.json({
      ok: true,
      vercel: vercelResult,
      message:
        "Domena dodana do projektu Vercel. Ustaw rekord CNAME wskazujący na cname.vercel-dns.com.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd domeny" },
      { status: 500 }
    );
  }
}
