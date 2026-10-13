import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const tenantSlug = String(form.get("tenantSlug") || "ogolne");
    const kind = String(form.get("kind") || "project");

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Plik zbyt duży (max 15 MB)" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `roofflow/${tenantSlug}/${kind}-${Date.now()}-${safeName}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // Fallback: data URL niepraktyczny — zwróć placeholder
      return NextResponse.json({
        url: `https://placeholder.roofflow.local/${pathname}`,
        demo: true,
      });
    }

    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd uploadu" },
      { status: 500 }
    );
  }
}
