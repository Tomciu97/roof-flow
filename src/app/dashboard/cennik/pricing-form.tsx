"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Initial = {
  baseLaborRate: number;
  timberRate: number;
  tileBudget: number;
  tileStandard: number;
  tilePremium: number;
  insulationWool: number;
  insulationPur: number;
  insulationPir: number;
  facadeStyrofoam: number;
  facadeWool: number;
  marginBuffer: number;
};

export function PricingForm({
  initial,
  showInsulation,
  showFacade,
  demo,
}: {
  initial: Initial;
  showInsulation: boolean;
  showFacade: boolean;
  demo?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof Initial>(key: K, value: number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (demo) {
      setMsg("Tryb demo — podłącz Supabase, aby zapisać stawki.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu");
      setMsg("Cennik zapisany.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Błąd");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <Section title="Stawki dekarskie">
        <Grid>
          <Num
            label="Robocizna (zł/m²)"
            value={form.baseLaborRate}
            onChange={(v) => set("baseLaborRate", v)}
          />
          <Num
            label="Drewno / więźba (zł/m³)"
            value={form.timberRate}
            onChange={(v) => set("timberRate", v)}
          />
          <Num
            label="Blachodachówka budżetowa (zł/m²)"
            value={form.tileBudget}
            onChange={(v) => set("tileBudget", v)}
          />
          <Num
            label="Dachówka ceramiczna (zł/m²)"
            value={form.tileStandard}
            onChange={(v) => set("tileStandard", v)}
          />
          <Num
            label="Blacha na rąbek (zł/m²)"
            value={form.tilePremium}
            onChange={(v) => set("tilePremium", v)}
          />
        </Grid>
      </Section>

      {showInsulation ? (
        <Section title="Stawki poddasza">
          <Grid>
            <Num
              label="Wełna mineralna (zł/m²)"
              value={form.insulationWool}
              onChange={(v) => set("insulationWool", v)}
            />
            <Num
              label="Pianka PUR (zł/m²)"
              value={form.insulationPur}
              onChange={(v) => set("insulationPur", v)}
            />
            <Num
              label="Płyty PIR (zł/m²)"
              value={form.insulationPir}
              onChange={(v) => set("insulationPir", v)}
            />
          </Grid>
        </Section>
      ) : (
        <p className="text-sm text-[var(--rf-muted)]">
          Moduł poddasza niedostępny — aktywuj add-on lub plan PRO.
        </p>
      )}

      {showFacade ? (
        <Section title="Stawki elewacyjne">
          <Grid>
            <Num
              label="Styropian grafitowy (zł/m²)"
              value={form.facadeStyrofoam}
              onChange={(v) => set("facadeStyrofoam", v)}
            />
            <Num
              label="Wełna fasadowa (zł/m²)"
              value={form.facadeWool}
              onChange={(v) => set("facadeWool", v)}
            />
          </Grid>
        </Section>
      ) : (
        <p className="text-sm text-[var(--rf-muted)]">
          Moduł elewacji niedostępny — aktywuj add-on lub plan PRO.
        </p>
      )}

      <Section title="Ustawienia marginesu">
        <div className="max-w-xs">
          <Label>Bufor tolerancji wyceny</Label>
          <SelectBuffer
            value={form.marginBuffer}
            onChange={(v) => set("marginBuffer", v)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Cena min/max = suma × (1 ± bufor)
          </p>
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz cennik"}
        </Button>
        {msg ? <p className="text-sm text-[var(--rf-muted)]">{msg}</p> : null}
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--rf-border)] bg-white p-5 md:p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function SelectBuffer({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <select
      className="h-11 w-full rounded-lg border border-[var(--rf-border)] bg-white px-3"
      value={String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value="0.05">± 5%</option>
      <option value="0.08">± 8%</option>
      <option value="0.1">± 10%</option>
      <option value="0.15">± 15%</option>
    </select>
  );
}
