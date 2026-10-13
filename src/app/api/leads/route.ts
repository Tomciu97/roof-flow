import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendLeadNotificationEmail,
  sendLeadReceiptEmail,
} from "@/lib/email";
import type { CalculationBreakdown, WizardState } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantSlug,
      clientName,
      clientPhone,
      clientEmail,
      location,
      schedule,
      state,
      result,
      projectFileUrl,
    } = body as {
      tenantSlug: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      location?: string;
      schedule?: string;
      state: WizardState;
      result: CalculationBreakdown;
      projectFileUrl?: string;
    };

    if (!tenantSlug || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Wymagane: firma, imię i telefon" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: true, demo: true, id: "demo-lead" });
    }

    const supabase = await createServiceClient();
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("*, auth_email:user_id")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (tErr || !tenant) {
      // Fallback bez join
      const { data: t2 } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", tenantSlug)
        .maybeSingle();
      if (!t2) {
        return NextResponse.json({ error: "Nie znaleziono firmy" }, { status: 404 });
      }
      return await insertLead(supabase, t2, {
        clientName,
        clientPhone,
        clientEmail,
        location,
        schedule,
        state,
        result,
        projectFileUrl,
      });
    }

    return await insertLead(supabase, tenant, {
      clientName,
      clientPhone,
      clientEmail,
      location,
      schedule,
      state,
      result,
      projectFileUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd zapisu leada" },
      { status: 500 }
    );
  }
}

async function insertLead(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  tenant: {
    id: string;
    name: string;
    phone: string | null;
    user_id: string;
  },
  data: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    location?: string;
    schedule?: string;
    state: WizardState;
    result: CalculationBreakdown;
    projectFileUrl?: string;
  }
) {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      tenant_id: tenant.id,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      client_email: data.clientEmail || null,
      location: data.location || null,
      schedule: data.schedule || null,
      roof_type: data.state.roofType,
      roof_area_m2: data.result.roofAreaWithWasteM2,
      insulation_area_m2: data.result.insulationAreaM2 || null,
      facade_area_m2: data.result.facadeNetAreaM2 || null,
      est_price_min: data.result.priceMin,
      est_price_max: data.result.priceMax,
      project_file_url: data.projectFileUrl || null,
      status: "new",
      calculation_data: { state: data.state, result: data.result },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Powiadomienie właściciela — e-mail z auth.users jeśli dostępny
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(
      tenant.user_id
    );
    if (userData?.user?.email) {
      await sendLeadNotificationEmail({
        to: userData.user.email,
        tenantName: tenant.name,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        location: data.location,
        priceMin: data.result.priceMin,
        priceMax: data.result.priceMax,
      });
    }
  } catch {
    /* admin API może być niedostępne */
  }

  if (data.clientEmail) {
    await sendLeadReceiptEmail({
      to: data.clientEmail,
      tenantName: tenant.name,
      tenantPhone: tenant.phone,
    });
  }

  // SMS — opcjonalnie przez webhook/provider (Twilio/SMSAPI)
  if (process.env.SMS_WEBHOOK_URL) {
    await fetch(process.env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: tenant.phone,
        message: `RoofFlow: nowy lead ${data.clientName}, tel. ${data.clientPhone}`,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, id: lead.id });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

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
