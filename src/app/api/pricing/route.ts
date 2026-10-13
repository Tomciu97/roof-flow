import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "Brak profilu firmy" }, { status: 404 });
    }

    const payload = {
      tenant_id: tenant.id,
      base_labor_rate: body.baseLaborRate,
      timber_rate: body.timberRate,
      tile_rates: {
        budget: body.tileBudget,
        standard: body.tileStandard,
        premium: body.tilePremium,
      },
      insulation_rates: {
        wool: body.insulationWool,
        pur: body.insulationPur,
        pir: body.insulationPir,
      },
      facade_rates: {
        styrofoam: body.facadeStyrofoam,
        wool: body.facadeWool,
      },
      margin_buffer: body.marginBuffer,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("pricing_configs")
      .upsert(payload, { onConflict: "tenant_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const updates: Record<string, string> = {};
    if (body.brand_color) updates.brand_color = body.brand_color;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    const { error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd" },
      { status: 500 }
    );
  }
}
