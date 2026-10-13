"use client";

import type {
  CoveringStandard,
  FacadeMaterial,
  RoofType,
  WizardState,
} from "@/lib/types";
import { ROOF_TYPE_LABELS } from "@/lib/constants";

const COVER_COLORS: Record<CoveringStandard, { fill: string; stroke: string; label: string }> = {
  budget: { fill: "#7c8a96", stroke: "#4b5563", label: "Blachodachówka" },
  standard: { fill: "#b45309", stroke: "#78350f", label: "Dachówka ceramiczna" },
  premium: { fill: "#334155", stroke: "#0f172a", label: "Blacha na rąbek" },
};

const FACADE_COLORS: Record<FacadeMaterial, { fill: string; pattern: string }> = {
  styrofoam: { fill: "#475569", pattern: "graphite" },
  wool: { fill: "#d6d3d1", pattern: "wool" },
};

function roofPath(
  type: RoofType,
  pitchDeg: number,
  wallTop: number,
  left: number,
  right: number,
  ridgeYBase: number
) {
  const pitchFactor = Math.min(Math.max(pitchDeg, 0), 55) / 55;
  const rise = 28 + pitchFactor * 52;
  const ridgeY = ridgeYBase - rise;
  const mid = (left + right) / 2;
  const eaves = 10;

  switch (type) {
    case "flat":
      return {
        d: `M ${left - eaves} ${wallTop} L ${right + eaves} ${wallTop} L ${right + eaves} ${wallTop + 8} L ${left - eaves} ${wallTop + 8} Z`,
        ridge: null as null | { x: number; y: number },
      };
    case "monopitch":
      return {
        d: `M ${left - eaves} ${wallTop - rise * 0.25} L ${right + eaves} ${ridgeY} L ${right} ${wallTop} L ${left} ${wallTop} Z`,
        ridge: { x: right - 8, y: ridgeY + 4 },
      };
    case "hip":
      return {
        d: `M ${left - eaves} ${wallTop} L ${mid} ${ridgeY} L ${right + eaves} ${wallTop} L ${right - 18} ${wallTop} L ${mid} ${ridgeY + rise * 0.35} L ${left + 18} ${wallTop} Z`,
        ridge: { x: mid, y: ridgeY },
      };
    case "gabled":
    default:
      return {
        d: `M ${left - eaves} ${wallTop} L ${mid} ${ridgeY} L ${right + eaves} ${wallTop} Z`,
        ridge: { x: mid, y: ridgeY },
      };
  }
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
  const cover = COVER_COLORS[state.covering];
  const facade = FACADE_COLORS[state.facadeMaterial];
  const wallFill =
    showFacade && state.facadeEnabled ? facade.fill : "#f8fafc";
  const wallStroke = showFacade && state.facadeEnabled ? "#1e293b" : "#94a3b8";

  const maxDim = Math.max(state.lengthM, state.widthM, 1);
  const scale = 140 / maxDim;
  const bodyW = Math.max(70, Math.min(160, state.widthM * scale));
  const bodyH = Math.max(48, Math.min(90, state.storeyHeightM * 22));
  const left = 100 - bodyW / 2;
  const right = 100 + bodyW / 2;
  const ground = 168;
  const wallTop = ground - bodyH;
  const roof = roofPath(state.roofType, state.pitchDeg, wallTop, left, right, wallTop);

  const lengthLabel = `${state.lengthM.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;
  const widthLabel = `${state.widthM.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;
  const heightLabel = `${state.storeyHeightM.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;
  const pitchLabel = `${state.pitchDeg}°`;
  const eavesLabel = `okap ${state.eavesM.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-gradient-to-b from-[#e8f2ef] to-[#f7faf8] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--rf-border)]/70 px-4 py-2.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-accent)]">
            Podgląd na żywo
          </p>
          <p className="text-sm font-medium text-[var(--rf-ink)]">
            {ROOF_TYPE_LABELS[state.roofType]}
          </p>
        </div>
        <p className="text-xs text-[var(--rf-muted)]">{cover.label}</p>
      </div>

      <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label="Wizualizacja budynku">
        <defs>
          <pattern id="tile-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8 L8 0" stroke={cover.stroke} strokeWidth="0.6" opacity="0.45" />
          </pattern>
          <pattern id="wool-pattern" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#a8a29e" opacity="0.5" />
            <circle cx="5" cy="5" r="0.8" fill="#78716c" opacity="0.35" />
          </pattern>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e8f2ef" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="200" height="200" fill="url(#sky)" />
        <ellipse cx="100" cy="178" rx="78" ry="10" fill="#0f766e" opacity="0.08" />

        {/* Ściany */}
        <rect
          x={left}
          y={wallTop}
          width={bodyW}
          height={bodyH}
          fill={wallFill}
          stroke={wallStroke}
          strokeWidth="1.5"
          rx="1"
        />
        {showFacade && state.facadeEnabled && state.facadeMaterial === "wool" ? (
          <rect
            x={left}
            y={wallTop}
            width={bodyW}
            height={bodyH}
            fill="url(#wool-pattern)"
            opacity="0.55"
          />
        ) : null}

        {/* Okna */}
        <rect
          x={left + bodyW * 0.18}
          y={wallTop + bodyH * 0.28}
          width={bodyW * 0.18}
          height={bodyH * 0.28}
          fill="#bae6fd"
          stroke="#64748b"
          strokeWidth="1"
          rx="1"
        />
        <rect
          x={left + bodyW * 0.64}
          y={wallTop + bodyH * 0.28}
          width={bodyW * 0.18}
          height={bodyH * 0.28}
          fill="#bae6fd"
          stroke="#64748b"
          strokeWidth="1"
          rx="1"
        />
        {/* Drzwi */}
        <rect
          x={100 - bodyW * 0.08}
          y={wallTop + bodyH * 0.45}
          width={bodyW * 0.16}
          height={bodyH * 0.55}
          fill="#78350f"
          stroke="#451a03"
          strokeWidth="1"
          rx="1"
        />

        {/* Dach */}
        <path d={roof.d} fill={cover.fill} stroke={cover.stroke} strokeWidth="1.4" />
        <path d={roof.d} fill="url(#tile-pattern)" opacity="0.55" />

        {/* Izolacja (warstwa wewnętrzna) */}
        {showInsulation && state.insulationEnabled ? (
          <path
            d={roof.d}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2 + state.insulationThicknessCm / 12}
            strokeDasharray="4 2"
            opacity="0.85"
            transform={`translate(0, ${Math.min(8, state.insulationThicknessCm / 4)})`}
          />
        ) : null}

        {/* Wymiary — szerokość */}
        <line
          x1={left}
          y1={ground + 10}
          x2={right}
          y2={ground + 10}
          stroke="#0f766e"
          strokeWidth="1.2"
        />
        <line x1={left} y1={ground + 6} x2={left} y2={ground + 14} stroke="#0f766e" />
        <line x1={right} y1={ground + 6} x2={right} y2={ground + 14} stroke="#0f766e" />
        <rect
          x={88}
          y={ground + 14}
          width={24}
          height={12}
          rx="3"
          fill="white"
          stroke="#0f766e"
          strokeWidth="0.8"
        />
        <text
          x="100"
          y={ground + 23}
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="#0f766e"
        >
          {widthLabel}
        </text>

        {/* Wymiary — wysokość */}
        <line
          x1={right + 12}
          y1={wallTop}
          x2={right + 12}
          y2={ground}
          stroke="#c2410c"
          strokeWidth="1.2"
        />
        <line x1={right + 8} y1={wallTop} x2={right + 16} y2={wallTop} stroke="#c2410c" />
        <line x1={right + 8} y1={ground} x2={right + 16} y2={ground} stroke="#c2410c" />
        <text
          x={right + 18}
          y={(wallTop + ground) / 2 + 2}
          fontSize="7"
          fontWeight="700"
          fill="#c2410c"
        >
          {heightLabel}
        </text>

        {/* Długość (głębia — etykieta) */}
        <text x="12" y="22" fontSize="8" fill="#475569" fontWeight="600">
          Długość: {lengthLabel}
        </text>
        <text x="12" y="34" fontSize="8" fill="#475569">
          Kąt: {pitchLabel} · {eavesLabel}
        </text>

        {roof.ridge ? (
          <g>
            <circle cx={roof.ridge.x} cy={roof.ridge.y} r="2.2" fill="#0f766e" />
            <text
              x={roof.ridge.x + 6}
              y={roof.ridge.y - 4}
              fontSize="7"
              fill="#0f766e"
              fontWeight="600"
            >
              {pitchLabel}
            </text>
          </g>
        ) : null}

        {state.gutters ? (
          <path
            d={`M ${left - 10} ${wallTop + 2} Q ${left - 14} ${wallTop + 10} ${left - 8} ${wallTop + 16}`}
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
          />
        ) : null}

        {state.roofWindows > 0 && state.roofType !== "flat" ? (
          <rect
            x={100 - 8}
            y={wallTop - 28}
            width="16"
            height="12"
            fill="#7dd3fc"
            stroke="#0369a1"
            strokeWidth="1"
            transform={`rotate(-${Math.min(state.pitchDeg, 40)} 100 ${wallTop - 22})`}
            rx="1"
          />
        ) : null}
      </svg>

      <div className="grid grid-cols-3 gap-2 border-t border-[var(--rf-border)]/70 px-3 py-3 text-center text-[11px]">
        <div className="rounded-lg bg-white/80 px-2 py-1.5">
          <p className="text-slate-500">Szerokość</p>
          <p className="font-semibold text-[var(--rf-ink)]">{widthLabel}</p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5">
          <p className="text-slate-500">Długość</p>
          <p className="font-semibold text-[var(--rf-ink)]">{lengthLabel}</p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5">
          <p className="text-slate-500">Wysokość</p>
          <p className="font-semibold text-[var(--rf-ink)]">{heightLabel}</p>
        </div>
      </div>
    </div>
  );
}
