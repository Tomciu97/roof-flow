"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { RoofType, WizardState } from "@/lib/types";
import {
  COVERING_LABELS,
  FACADE_LABELS,
  INSULATION_LABELS,
  ROOF_TYPE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type ViewMode = "3d" | "section";

const ROOF_IMAGES: Record<RoofType, { view3d: string; section: string }> = {
  gabled: {
    view3d: "/visuals/roofs/roof-gabled-3d.jpg",
    section: "/visuals/roofs/roof-gabled-section.jpg",
  },
  hip: {
    view3d: "/visuals/roofs/roof-hip-3d.jpg",
    section: "/visuals/roofs/roof-hip-section.jpg",
  },
  monopitch: {
    view3d: "/visuals/roofs/roof-monopitch-3d.jpg",
    section: "/visuals/roofs/roof-monopitch-section.jpg",
  },
  flat: {
    view3d: "/visuals/roofs/roof-flat-3d.jpg",
    section: "/visuals/roofs/roof-flat-section.jpg",
  },
};

const ROOF_HINTS: Record<RoofType, string> = {
  gabled: "Dwie połacie i kalenica — klasyczny dach dwuspadowy",
  hip: "Cztery połacie — dach kopertowy / czterospadowy",
  monopitch: "Jedna połać ze spadkiem w jedną stronę",
  flat: "Prawie pozioma powierzchnia dachu płaskiego",
};

function fmt(n: number) {
  return `${n.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;
}

export function BuildingPreview({
  state,
  showFacade = false,
  showInsulation = false,
  className = "",
}: {
  state: WizardState;
  showFacade?: boolean;
  showInsulation?: boolean;
  className?: string;
}) {
  const [view, setView] = useState<ViewMode>("3d");
  const src =
    view === "3d"
      ? ROOF_IMAGES[state.roofType].view3d
      : ROOF_IMAGES[state.roofType].section;

  const footprint = useMemo(() => {
    const max = Math.max(state.lengthM, state.widthM, 1);
    return {
      w: Math.max(28, (state.lengthM / max) * 100),
      h: Math.max(22, (state.widthM / max) * 72),
    };
  }, [state.lengthM, state.widthM]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--rf-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-accent)]">
            Podgląd budynku
          </p>
          <p className="truncate font-display text-lg font-semibold text-[var(--rf-ink)]">
            {ROOF_TYPE_LABELS[state.roofType]}
          </p>
          <p className="text-xs text-[var(--rf-muted)]">
            {ROOF_HINTS[state.roofType]}
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--rf-border)] bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("3d")}
            className={cn(
              "rounded-md px-3 py-1.5 transition",
              view === "3d"
                ? "bg-[var(--rf-ink)] text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            )}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setView("section")}
            className={cn(
              "rounded-md px-3 py-1.5 transition",
              view === "section"
                ? "bg-[var(--rf-ink)] text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            )}
          >
            Przekrój
          </button>
        </div>
      </div>

      {/* Grafika + wymiary jako czytelne UI, nie rysowane na SVG */}
      <div className="relative bg-[#e8eef2]">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            key={src}
            src={src}
            alt={`${ROOF_TYPE_LABELS[state.roofType]} — widok ${view === "3d" ? "3D" : "przekrój"}`}
            fill
            className="object-cover object-center transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 420px"
            priority
          />

          {/* Gradient dla czytelności badge'y */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

          {/* Badge kąta / typu na grafice */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge tone="violet">
              {state.roofType === "flat" ? "Dach płaski" : `Kąt ${state.pitchDeg}°`}
            </Badge>
            {state.eavesM > 0 ? (
              <Badge tone="slate">Okap {fmt(state.eavesM)}</Badge>
            ) : null}
          </div>

          {/* Duże wymiary na dole grafiki */}
          <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DimCard
              label="Długość"
              value={fmt(state.lengthM)}
              tone="teal"
            />
            <DimCard
              label="Szerokość"
              value={fmt(state.widthM)}
              tone="blue"
            />
            <DimCard
              label="Wysokość ścian"
              value={fmt(state.storeyHeightM)}
              tone="orange"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </div>

      {/* Rzut z góry — proporcje L×W reagują na input */}
      <div className="grid gap-3 border-t border-[var(--rf-border)] p-4 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rzut z góry · proporcje budynku
          </p>
          <div className="mt-3 flex min-h-[110px] items-center justify-center rounded-xl bg-slate-50 px-4 py-4">
            <div className="relative">
              <div
                className="rounded-md border-2 border-[var(--rf-accent)] bg-teal-50/90 shadow-sm transition-all duration-300"
                style={{ width: footprint.w, height: footprint.h }}
              />
              <p className="mt-2 text-center text-xs font-bold text-[var(--rf-accent)]">
                dł. {fmt(state.lengthM)}
              </p>
              <p
                className="absolute left-full top-1/2 ml-2 -translate-y-1/2 text-xs font-bold text-sky-700"
                style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
              >
                szer. {fmt(state.widthM)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--rf-muted)]">
            {view === "3d"
              ? "Grafika 3D pokazuje typ dachu. Wymiary aktualizują się z formularza."
              : "Przekrój z boku — widać kąt dachu i wysokość ścian. Długość jest „w głąb”."}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow
            label="Pokrycie"
            value={COVERING_LABELS[state.covering]}
          />
          {showInsulation && state.insulationEnabled ? (
            <InfoRow
              label="Poddasze"
              value={`${INSULATION_LABELS[state.insulationMaterial]} · ${state.insulationThicknessCm} cm`}
            />
          ) : null}
          {showFacade && state.facadeEnabled ? (
            <InfoRow
              label="Elewacja"
              value={FACADE_LABELS[state.facadeMaterial]}
            />
          ) : null}
          <InfoRow
            label="Pow. rzutu"
            value={`${(state.lengthM * state.widthM).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m²`}
          />
        </div>
      </div>
    </div>
  );
}

function DimCard({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string;
  tone: "teal" | "blue" | "orange";
  className?: string;
}) {
  const tones = {
    teal: "border-teal-200 bg-white/95 text-teal-900",
    blue: "border-sky-200 bg-white/95 text-sky-900",
    orange: "border-orange-200 bg-white/95 text-orange-900",
  };
  const labels = {
    teal: "text-teal-700",
    blue: "text-sky-700",
    orange: "text-orange-700",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm",
        tones[tone],
        className
      )}
    >
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", labels[tone])}>
        {label}
      </p>
      <p className="font-display text-xl font-semibold leading-tight">{value}</p>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "violet" | "slate";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm",
        tone === "violet"
          ? "bg-violet-600/90 text-white"
          : "bg-slate-900/70 text-white"
      )}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--rf-border)] bg-slate-50/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium text-[var(--rf-ink)]">{value}</p>
    </div>
  );
}
