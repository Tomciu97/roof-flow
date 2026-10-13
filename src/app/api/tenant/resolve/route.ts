import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const host =
    request.headers.get("x-tenant-domain") ||
    new URL(request.url).searchParams.get("domain");

  if (!host) {
    return NextResponse.json({ error: "Brak domeny" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Brak Supabase" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("tenants")
    .select("slug, name, custom_domain")
    .eq("custom_domain", host.toLowerCase())
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Nie znaleziono tenanta" }, { status: 404 });
  }

  return NextResponse.json(data);
}
