"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WidgetStudio({
  initialColor,
  logoUrl,
  publicUrl,
  slug,
  demo,
}: {
  initialColor: string;
  logoUrl: string | null;
  publicUrl: string;
  slug: string;
  demo?: boolean;
}) {
  const [color, setColor] = useState(initialColor);
  const [logo, setLogo] = useState(logoUrl);
  const [copied, setCopied] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const iframeCode = `<iframe src="${publicUrl}" title="Kalkulator RoofFlow" width="100%" height="900" style="border:0;border-radius:12px;" loading="lazy"></iframe>`;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function saveBrand() {
    if (demo) {
      setMsg("Tryb demo — podłącz Supabase, aby zapisać branding.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_color: color, logo_url: logo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      setMsg("Zapisano wygląd widgetu.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Błąd");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tenantSlug", slug);
    fd.append("kind", "logo");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setLogo(data.url);
    else setMsg(data.error || "Błąd uploadu logo");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">Kreator widgetu</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Kolor przewodni</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                className="h-11 w-16 p-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Logo firmy</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
              }}
            />
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" className="mt-2 h-12 object-contain" />
            ) : null}
          </div>
        </div>
        <div
          className="mt-6 rounded-lg px-4 py-6 text-white"
          style={{ background: color }}
        >
          <p className="font-display text-2xl">Podgląd nagłówka</p>
          <p className="text-sm text-white/80">Kolor i branding widgetu</p>
        </div>
        <Button className="mt-4" type="button" onClick={saveBrand} disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz wygląd"}
        </Button>
        {msg ? <p className="mt-2 text-sm text-[var(--rf-muted)]">{msg}</p> : null}
      </section>

      <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">Gotowy link</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Udostępnij SMS-em lub w social mediach.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={publicUrl} />
          <Button type="button" variant="outline" onClick={() => copy(publicUrl, "link")}>
            {copied === "link" ? "Skopiowano" : "Kopiuj"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">Kod do osadzenia</h2>
        <p className="mt-1 text-sm text-[var(--rf-muted)]">
          Wklej na WordPress / Wix / HTML.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {iframeCode}
        </pre>
        <Button
          className="mt-3"
          type="button"
          variant="outline"
          onClick={() => copy(iframeCode, "iframe")}
        >
          {copied === "iframe" ? "Skopiowano" : "Kopiuj kod iframe"}
        </Button>
      </section>
    </div>
  );
}
