"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type {
  CoveringStandard,
  FacadeMaterial,
  InsulationMaterial,
  RoofType,
} from "@/lib/types";
import {
  COVERING_LABELS,
  FACADE_LABELS,
  INSULATION_LABELS,
  ROOF_TYPE_LABELS,
} from "@/lib/constants";

const ROOF_THUMBS: Record<RoofType, string> = {
  gabled: "/visuals/roofs/roof-gabled-3d.jpg",
  hip: "/visuals/roofs/roof-hip-3d.jpg",
  monopitch: "/visuals/roofs/roof-monopitch-3d.jpg",
  flat: "/visuals/roofs/roof-flat-3d.jpg",
};

export function RoofTypeCards({
  value,
  onChange,
}: {
  value: RoofType;
  onChange: (v: RoofType) => void;
}) {
  const items: { id: RoofType; hint: string }[] = [
    { id: "gabled", hint: "Klasyczny dom z kalenicą" },
    { id: "hip", hint: "Cztery połacie — widać w podglądzie 3D" },
    { id: "monopitch", hint: "Nowoczesny dach jednospadowy" },
    { id: "flat", hint: "Dach płaski / stropodach" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition",
              active
                ? "border-[var(--rf-accent)] ring-2 ring-[var(--rf-accent)]/25"
                : "border-[var(--rf-border)] bg-white hover:border-teal-300"
            )}
          >
            <span className="relative block h-20 w-full bg-slate-100">
              <Image
                src={ROOF_THUMBS[item.id]}
                alt={ROOF_TYPE_LABELS[item.id]}
                fill
                className="object-cover"
                sizes="200px"
              />
            </span>
            <span className="block px-3 py-2.5">
              <span className="block text-sm font-semibold">
                {ROOF_TYPE_LABELS[item.id]}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--rf-muted)]">
                {item.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CoveringCards({
  value,
  onChange,
}: {
  value: CoveringStandard;
  onChange: (v: CoveringStandard) => void;
}) {
  const items: {
    id: CoveringStandard;
    swatch: string;
    pattern: string;
    hint: string;
  }[] = [
    {
      id: "budget",
      swatch: "#7c8a96",
      pattern: "repeating-linear-gradient(135deg,#7c8a96 0 6px,#6b7785 6px 12px)",
      hint: "Ekonomiczna blachodachówka — szybki montaż",
    },
    {
      id: "standard",
      swatch: "#b45309",
      pattern: "repeating-linear-gradient(90deg,#b45309 0 8px,#92400e 8px 10px)",
      hint: "Klasyczna dachówka ceramiczna — trwałość",
    },
    {
      id: "premium",
      swatch: "#334155",
      pattern: "repeating-linear-gradient(0deg,#334155 0 3px,#1e293b 3px 6px)",
      hint: "Blacha na rąbek — wygląd premium",
    },
  ];

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
              active
                ? "border-[var(--rf-accent)] bg-teal-50/80 ring-2 ring-[var(--rf-accent)]/20"
                : "border-[var(--rf-border)] bg-white hover:border-teal-300"
            )}
          >
            <span
              className="h-14 w-20 shrink-0 rounded-lg border border-black/10 shadow-inner"
              style={{ background: item.pattern }}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-semibold">
                {COVERING_LABELS[item.id]}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--rf-muted)]">
                {item.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function InsulationCards({
  value,
  onChange,
}: {
  value: InsulationMaterial;
  onChange: (v: InsulationMaterial) => void;
}) {
  const items: { id: InsulationMaterial; color: string; hint: string }[] = [
    {
      id: "wool",
      color: "linear-gradient(135deg,#f5f5f4,#d6d3d1 40%,#a8a29e)",
      hint: "Wełna — dobra izolacja akustyczna",
    },
    {
      id: "pur",
      color: "linear-gradient(135deg,#fef3c7,#f59e0b 50%,#d97706)",
      hint: "Pianka PUR — szczelność i cienka warstwa",
    },
    {
      id: "pir",
      color: "linear-gradient(135deg,#e0e7ff,#6366f1 45%,#312e81)",
      hint: "Płyty PIR — najwyższy parametr lambda",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-xl border p-3 text-left transition",
              active
                ? "border-[var(--rf-accent)] bg-teal-50/80 ring-2 ring-[var(--rf-accent)]/20"
                : "border-[var(--rf-border)] bg-white hover:border-teal-300"
            )}
          >
            <span
              className="mb-3 block h-16 w-full rounded-lg border border-black/5"
              style={{ background: item.color }}
            />
            <span className="block text-sm font-semibold">
              {INSULATION_LABELS[item.id]}
            </span>
            <span className="mt-1 block text-xs text-[var(--rf-muted)]">
              {item.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FacadeCards({
  value,
  onChange,
}: {
  value: FacadeMaterial;
  onChange: (v: FacadeMaterial) => void;
}) {
  const items: { id: FacadeMaterial; color: string; hint: string }[] = [
    {
      id: "styrofoam",
      color: "linear-gradient(135deg,#64748b,#334155 55%,#1e293b)",
      hint: "Styropian grafitowy — popularny i ciepły",
    },
    {
      id: "wool",
      color: "radial-gradient(circle at 30% 30%,#e7e5e4,#a8a29e 55%,#78716c)",
      hint: "Wełna fasadowa — ognioodporność + akustyka",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition",
              active
                ? "border-[var(--rf-accent)] ring-2 ring-[var(--rf-accent)]/20"
                : "border-[var(--rf-border)] hover:border-teal-300"
            )}
          >
            <span
              className="block h-24 w-full"
              style={{ background: item.color }}
            />
            <span className="block bg-white px-3 py-3">
              <span className="block text-sm font-semibold">
                {FACADE_LABELS[item.id]}
              </span>
              <span className="mt-1 block text-xs text-[var(--rf-muted)]">
                {item.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
