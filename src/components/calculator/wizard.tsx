"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateFromWizard,
  formatM2,
  formatPln,
  resolveB2CAmount,
} from "@/lib/calculator";
import { DEFAULT_WIZARD_STATE } from "@/lib/constants";
import type {
  CoveringStandard,
  FacadeMaterial,
  InsulationMaterial,
  PricingRates,
  RoofType,
  WizardState,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { BuildingPreview } from "@/components/calculator/building-preview";
import {
  CoveringCards,
  FacadeCards,
  InsulationCards,
  RoofTypeCards,
} from "@/components/calculator/material-cards";

type Mode = "b2c" | "tenant";

interface WizardProps {
  mode: Mode;
  rates?: PricingRates;
  brandColor?: string;
  tenantSlug?: string;
  showModules?: { insulation: boolean; facade: boolean };
}

const STEPS_B2C = [
  "Wymiary i dach",
  "Pokrycie",
  "Poddasze",
  "Elewacja",
  "Płatność",
];

const STEPS_TENANT = [
  "Wymiary i dach",
  "Pokrycie",
  "Dodatki",
  "Kontakt",
];

export function CalculatorWizard({
  mode,
  rates,
  brandColor = "#0f766e",
  tenantSlug,
  showModules = { insulation: true, facade: true },
}: WizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  const [lead, setLead] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    schedule: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const steps = mode === "b2c" ? STEPS_B2C : STEPS_TENANT;
  const result = useMemo(
    () => calculateFromWizard(state, rates),
    [state, rates]
  );
  const amount = resolveB2CAmount(
    state.insulationEnabled,
    state.facadeEnabled
  );

  const showPreview =
    (mode === "b2c" && step <= 3) ||
    (mode === "tenant" && step <= 2);

  const showFacadeOnPreview =
    (mode === "b2c" && step === 3) ||
    (mode === "tenant" && step === 2 && state.facadeEnabled);
  const showInsulationOnPreview =
    (mode === "b2c" && step === 2) ||
    (mode === "tenant" && step === 2 && state.insulationEnabled);

  function patch(p: Partial<WizardState>) {
    setState((s) => ({ ...s, ...p }));
  }

  async function payB2C() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/b2c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd płatności");
      window.location.href = data.url;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nie udało się rozpocząć płatności"
      );
      setLoading(false);
    }
  }

  async function submitLead() {
    setLoading(true);
    setError(null);
    try {
      let projectFileUrl: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("tenantSlug", tenantSlug || "");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData.error || "Błąd uploadu");
        projectFileUrl = upData.url;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          clientName: lead.name,
          clientPhone: lead.phone,
          clientEmail: lead.email || undefined,
          location: lead.location,
          schedule: lead.schedule,
          state,
          result,
          projectFileUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd zapisu");
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nie udało się wysłać zapytania"
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--rf-border)] bg-white p-8 text-center">
        <h2 className="font-display text-2xl font-semibold">Dziękujemy!</h2>
        <p className="mt-2 text-[var(--rf-muted)]">
          Twoje zapytanie zostało przekazane firmie. Odezwiemy się wkrótce.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-white shadow-sm">
      <div
        className="h-1.5 transition-[width] duration-300"
        style={{
          width: `${((step + 1) / steps.length) * 100}%`,
          background: brandColor,
        }}
      />
      <div className="border-b border-[var(--rf-border)] px-5 py-4 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Krok {step + 1} / {steps.length}
        </p>
        <h2 className="font-display text-xl font-semibold md:text-2xl">
          {steps[step]}
        </h2>
      </div>

      <div
        className={cn(
          "gap-6 px-5 py-6 md:px-8",
          showPreview ? "grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]" : "block"
        )}
      >
        <div className="space-y-5">
          {mode === "b2c" && step === 0 && (
            <GeometryStep state={state} patch={patch} />
          )}
          {mode === "b2c" && step === 1 && (
            <CoveringStep state={state} patch={patch} />
          )}
          {mode === "b2c" && step === 2 && (
            <InsulationStep state={state} patch={patch} paidAddon />
          )}
          {mode === "b2c" && step === 3 && (
            <FacadeStep state={state} patch={patch} paidAddon />
          )}
          {mode === "b2c" && step === 4 && (
            <PaywallStep
              state={state}
              patch={patch}
              result={result}
              amount={amount}
            />
          )}

          {mode === "tenant" && step === 0 && (
            <GeometryStep state={state} patch={patch} />
          )}
          {mode === "tenant" && step === 1 && (
            <CoveringStep state={state} patch={patch} />
          )}
          {mode === "tenant" && step === 2 && (
            <div className="space-y-6">
              {showModules.insulation ? (
                <InsulationStep state={state} patch={patch} />
              ) : null}
              {showModules.facade ? (
                <FacadeStep state={state} patch={patch} />
              ) : null}
              {!showModules.insulation && !showModules.facade ? (
                <p className="text-sm text-[var(--rf-muted)]">
                  Ta firma oferuje wycenę dachu. Przejdź dalej, aby zostawić
                  kontakt.
                </p>
              ) : null}
              <PreviewAreas result={result} />
            </div>
          )}
          {mode === "tenant" && step === 3 && (
            <LeadGate
              lead={lead}
              setLead={setLead}
              setFile={setFile}
              result={result}
            />
          )}

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        {showPreview ? (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <BuildingPreview
              state={state}
              showFacade={showFacadeOnPreview}
              showInsulation={showInsulationOnPreview}
            />
            <p className="mt-2 text-center text-xs text-[var(--rf-muted)]">
              Zmieniaj wymiary i typ dachu — podgląd aktualizuje się od razu.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--rf-border)] px-5 py-4 md:px-8">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0 || loading}
          onClick={() => setStep((s) => s - 1)}
        >
          Wstecz
        </Button>
        {mode === "b2c" && step === steps.length - 1 ? (
          <Button
            type="button"
            disabled={loading || !state.email}
            onClick={payB2C}
            style={{ background: brandColor }}
          >
            {loading ? "Przekierowanie…" : "Zapłać i Pobierz Raport PDF"}
          </Button>
        ) : mode === "tenant" && step === steps.length - 1 ? (
          <Button
            type="button"
            disabled={loading || !lead.name || !lead.phone}
            onClick={submitLead}
            style={{ background: brandColor }}
          >
            {loading ? "Wysyłanie…" : "Wyślij zapytanie"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            style={{ background: brandColor }}
          >
            Dalej
          </Button>
        )}
      </div>
    </div>
  );
}

function GeometryStep({
  state,
  patch,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2">Typ dachu</Label>
        <RoofTypeCards
          value={state.roofType}
          onChange={(roofType: RoofType) => patch({ roofType })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Długość budynku (m)">
          <Input
            type="number"
            min={3}
            step={0.1}
            value={state.lengthM}
            onChange={(e) => patch({ lengthM: Number(e.target.value) })}
          />
        </Field>
        <Field label="Szerokość budynku (m)">
          <Input
            type="number"
            min={3}
            step={0.1}
            value={state.widthM}
            onChange={(e) => patch({ widthM: Number(e.target.value) })}
          />
        </Field>
        <Field label="Kąt nachylenia (°)">
          <Input
            type="number"
            min={0}
            max={60}
            value={state.pitchDeg}
            onChange={(e) => patch({ pitchDeg: Number(e.target.value) })}
          />
        </Field>
        <Field label="Okap (m)">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={state.eavesM}
            onChange={(e) => patch({ eavesM: Number(e.target.value) })}
          />
        </Field>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Po prawej zobaczysz realistyczny podgląd dachu. Przełącz{" "}
        <strong>3D</strong> / <strong>Przekrój</strong> — wymiary długości,
        szerokości i wysokości aktualizują się na bieżąco.
      </p>
    </div>
  );
}

function CoveringStep({
  state,
  patch,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2">Standard pokrycia</Label>
        <CoveringCards
          value={state.covering}
          onChange={(covering: CoveringStandard) => patch({ covering })}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={state.gutters}
          onChange={(e) => patch({ gutters: e.target.checked })}
          className="h-4 w-4"
        />
        System rynnowy
      </label>
      <Field label="Liczba okien dachowych">
        <Input
          type="number"
          min={0}
          max={20}
          value={state.roofWindows}
          onChange={(e) => patch({ roofWindows: Number(e.target.value) })}
        />
      </Field>
    </div>
  );
}

function InsulationStep({
  state,
  patch,
  paidAddon,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  paidAddon?: boolean;
}) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={state.insulationEnabled}
          onChange={(e) => patch({ insulationEnabled: e.target.checked })}
          className="h-4 w-4"
        />
        Ocieplenie poddasza
        {paidAddon ? (
          <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
            +19 zł
          </span>
        ) : null}
      </label>
      <div
        className={cn(
          "space-y-4",
          !state.insulationEnabled && "pointer-events-none opacity-40"
        )}
      >
        <InsulationCards
          value={state.insulationMaterial}
          onChange={(insulationMaterial: InsulationMaterial) =>
            patch({ insulationMaterial })
          }
        />
        <Field label="Grubość warstwy (cm)">
          <Input
            type="number"
            min={10}
            max={40}
            value={state.insulationThicknessCm}
            onChange={(e) =>
              patch({ insulationThicknessCm: Number(e.target.value) })
            }
          />
        </Field>
      </div>
    </div>
  );
}

function FacadeStep({
  state,
  patch,
  paidAddon,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  paidAddon?: boolean;
}) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={state.facadeEnabled}
          onChange={(e) => patch({ facadeEnabled: e.target.checked })}
          className="h-4 w-4"
        />
        Ocieplenie elewacji
        {paidAddon ? (
          <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
            +19 zł
          </span>
        ) : null}
      </label>
      <div
        className={cn(
          "space-y-4",
          !state.facadeEnabled && "pointer-events-none opacity-40"
        )}
      >
        <FacadeCards
          value={state.facadeMaterial}
          onChange={(facadeMaterial: FacadeMaterial) =>
            patch({ facadeMaterial })
          }
        />
        <Field label="Wysokość kondygnacji (m)">
          <Input
            type="number"
            min={2}
            max={4}
            step={0.1}
            value={state.storeyHeightM}
            onChange={(e) =>
              patch({ storeyHeightM: Number(e.target.value) })
            }
          />
        </Field>
      </div>
    </div>
  );
}

function PaywallStep({
  state,
  patch,
  result,
  amount,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  result: ReturnType<typeof calculateFromWizard>;
  amount: number;
}) {
  return (
    <div className="space-y-5">
      <PreviewAreas result={result} />
      <div className="rounded-xl border border-[var(--rf-border)] bg-[var(--rf-sand)]/70 px-4 py-4">
        <p className="text-sm text-[var(--rf-muted)]">Do zapłaty za raport PDF</p>
        <p className="font-display text-3xl font-semibold">{amount} zł</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">
          {state.insulationEnabled && state.facadeEnabled
            ? "Pakiet FULL BUNDLE (promocja) — dach + poddasze + elewacja"
            : state.insulationEnabled || state.facadeEnabled
              ? "Dach + wybrany dodatek"
              : "Sam dach"}
        </p>
        <p className="mt-3 text-xs text-slate-600">
          Płatność przez Stripe Checkout. Bez kluczy Stripe przejdziesz ścieżką
          demonstracyjną i nadal pobierzesz PDF.
        </p>
      </div>
      <Field label="E-mail odbiorcy raportu">
        <Input
          type="email"
          required
          placeholder="jan@example.pl"
          value={state.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </Field>
    </div>
  );
}

function LeadGate({
  lead,
  setLead,
  setFile,
  result,
}: {
  lead: {
    name: string;
    phone: string;
    email: string;
    location: string;
    schedule: string;
  };
  setLead: (v: typeof lead) => void;
  setFile: (f: File | null) => void;
  result: ReturnType<typeof calculateFromWizard>;
}) {
  return (
    <div className="space-y-4">
      <PreviewAreas result={result} />
      <p className="text-sm text-[var(--rf-muted)]">
        Szacowany budżet:{" "}
        <strong>
          {formatPln(result.priceMin)} – {formatPln(result.priceMax)}
        </strong>
      </p>
      <Field label="Imię i nazwisko">
        <Input
          value={lead.name}
          onChange={(e) => setLead({ ...lead, name: e.target.value })}
          required
        />
      </Field>
      <Field label="Telefon">
        <Input
          type="tel"
          value={lead.phone}
          onChange={(e) => setLead({ ...lead, phone: e.target.value })}
          required
        />
      </Field>
      <Field label="E-mail (opcjonalnie)">
        <Input
          type="email"
          value={lead.email}
          onChange={(e) => setLead({ ...lead, email: e.target.value })}
        />
      </Field>
      <Field label="Miejscowość">
        <Input
          value={lead.location}
          onChange={(e) => setLead({ ...lead, location: e.target.value })}
        />
      </Field>
      <Field label="Planowany termin budowy">
        <Input
          value={lead.schedule}
          placeholder="np. wiosna 2027"
          onChange={(e) => setLead({ ...lead, schedule: e.target.value })}
        />
      </Field>
      <Field label="Plik projektu (opcjonalnie)">
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.dwg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Field>
    </div>
  );
}

function PreviewAreas({
  result,
}: {
  result: ReturnType<typeof calculateFromWizard>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Połać" value={formatM2(result.roofAreaWithWasteM2)} />
      <Stat
        label="Poddasze"
        value={
          result.insulationAreaM2 ? formatM2(result.insulationAreaM2) : "—"
        }
      />
      <Stat
        label="Elewacja"
        value={
          result.facadeNetAreaM2 ? formatM2(result.facadeNetAreaM2) : "—"
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
