"use client";

import { useId, useMemo, useState } from "react";
import type {
  CoveringStandard,
  FacadeMaterial,
  RoofType,
  WizardState,
} from "@/lib/types";
import { ROOF_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ViewMode = "iso" | "section";

const COVER: Record<CoveringStandard, { a: string; b: string; edge: string; label: string }> = {
  budget: { a: "#94a3b8", b: "#64748b", edge: "#475569", label: "Blachodachówka" },
  standard: { a: "#d97706", b: "#b45309", edge: "#78350f", label: "Dachówka ceramiczna" },
  premium: { a: "#475569", b: "#1e293b", edge: "#0f172a", label: "Blacha na rąbek" },
};

const FACADE: Record<FacadeMaterial, string> = {
  styrofoam: "#64748b",
  wool: "#d6d3d1",
};

type Pt = { x: number; y: number };

/**
 * Izometria „z góry” — lepiej widać typ dachu.
 * X = długość, Y = szerokość, Z = wysokość
 */
function iso(x: number, y: number, z: number, ox = 210, oy = 195): Pt {
  return {
    x: ox + (x - y) * 0.92,
    y: oy + (x + y) * 0.42 - z * 0.95,
  };
}

function poly(points: Pt[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function fmt(n: number) {
  return `${n.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m`;
}

function DimLabel({
  x,
  y,
  text,
  color = "#0f766e",
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
}) {
  const w = Math.max(36, text.length * 6.2);
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - 8}
        width={w}
        height={16}
        rx={4}
        fill="white"
        stroke={color}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

function DimLineIso({
  a,
  b,
  label,
  offset,
  color,
}: {
  a: Pt;
  b: Pt;
  label: string;
  offset: Pt;
  color: string;
}) {
  const a2 = { x: a.x + offset.x, y: a.y + offset.y };
  const b2 = { x: b.x + offset.x, y: b.y + offset.y };
  const mid = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 };
  return (
    <g stroke={color} fill="none" strokeWidth={1.4}>
      <line x1={a.x} y1={a.y} x2={a2.x} y2={a2.y} strokeDasharray="2 2" opacity={0.5} />
      <line x1={b.x} y1={b.y} x2={b2.x} y2={b2.y} strokeDasharray="2 2" opacity={0.5} />
      <line x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} />
      <line
        x1={a2.x - 3}
        y1={a2.y - 3}
        x2={a2.x + 3}
        y2={a2.y + 3}
        strokeWidth={1.2}
      />
      <line
        x1={b2.x - 3}
        y1={b2.y - 3}
        x2={b2.x + 3}
        y2={b2.y + 3}
        strokeWidth={1.2}
      />
      <DimLabel x={mid.x} y={mid.y - 10} text={label} color={color} />
    </g>
  );
}

function roofGeometry(
  type: RoofType,
  L: number,
  W: number,
  H: number,
  pitchDeg: number,
  eaves: number
) {
  const pitch = Math.min(Math.max(pitchDeg, type === "flat" ? 0 : 5), 55);
  const rise = type === "flat" ? Math.max(2, W * 0.02) : (W / 2) * Math.tan((pitch * Math.PI) / 180);
  const e = Math.min(eaves, W * 0.2, L * 0.15);

  // Podstawa dachu z okapem (na wysokości H)
  const x0 = -e;
  const x1 = L + e;
  const y0 = -e;
  const y1 = W + e;

  if (type === "flat") {
    return {
      faces: [
        {
          pts: [
            [x0, y0, H + rise],
            [x1, y0, H + rise],
            [x1, y1, H + rise],
            [x0, y1, H + rise],
          ] as [number, number, number][],
          shade: 0,
        },
      ],
      ridge: null as [number, number, number][] | null,
      rise,
    };
  }

  if (type === "monopitch") {
    // Spadek wzdłuż szerokości: nisko przy y=0, wysoko przy y=W
    return {
      faces: [
        {
          pts: [
            [x0, y0, H],
            [x1, y0, H],
            [x1, y1, H + rise],
            [x0, y1, H + rise],
          ] as [number, number, number][],
          shade: 0,
        },
      ],
      ridge: [
        [0, W, H + rise],
        [L, W, H + rise],
      ] as [number, number, number][],
      rise,
    };
  }

  if (type === "hip") {
    // Kalenica krótsza w środku długości
    const inset = Math.min(L * 0.28, W * 0.45);
    const rx0 = inset;
    const rx1 = L - inset;
    const midY = W / 2;
    return {
      faces: [
        {
          // przód (bliższa połaci wzdłuż Y=0)
          pts: [
            [x0, y0, H],
            [x1, y0, H],
            [rx1, midY, H + rise],
            [rx0, midY, H + rise],
          ] as [number, number, number][],
          shade: 0.08,
        },
        {
          // tył
          pts: [
            [x0, y1, H],
            [rx0, midY, H + rise],
            [rx1, midY, H + rise],
            [x1, y1, H],
          ] as [number, number, number][],
          shade: -0.12,
        },
        {
          // lewy trójkąt
          pts: [
            [x0, y0, H],
            [rx0, midY, H + rise],
            [x0, y1, H],
          ] as [number, number, number][],
          shade: 0.18,
        },
        {
          // prawy trójkąt
          pts: [
            [x1, y0, H],
            [x1, y1, H],
            [rx1, midY, H + rise],
          ] as [number, number, number][],
          shade: -0.05,
        },
      ],
      ridge: [
        [rx0, midY, H + rise],
        [rx1, midY, H + rise],
      ] as [number, number, number][],
      rise,
    };
  }

  // gabled — kalenica wzdłuż długości
  const midY = W / 2;
  return {
    faces: [
      {
        pts: [
          [x0, y0, H],
          [x1, y0, H],
          [x1, midY, H + rise],
          [x0, midY, H + rise],
        ] as [number, number, number][],
        shade: 0.1,
      },
      {
        pts: [
          [x0, y1, H],
          [x0, midY, H + rise],
          [x1, midY, H + rise],
          [x1, y1, H],
        ] as [number, number, number][],
        shade: -0.15,
      },
    ],
    ridge: [
      [0, midY, H + rise],
      [L, midY, H + rise],
    ] as [number, number, number][],
    rise,
  };
}

function shadeColor(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) * (1 + amount)));
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) * (1 + amount)));
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) * (1 + amount)));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function IsometricBuilding({
  state,
  showFacade,
  showInsulation,
  uid,
}: {
  state: WizardState;
  showFacade: boolean;
  showInsulation: boolean;
  uid: string;
}) {
  const cover = COVER[state.covering];
  const wallBase =
    showFacade && state.facadeEnabled ? FACADE[state.facadeMaterial] : "#f1f5f9";
  const wallFront = shadeColor(wallBase, 0.05);
  const wallSide = shadeColor(wallBase, -0.12);

  // Skala tak, by budynek mieścił się w widoku (z miejscem na wymiary)
  const maxPlan = Math.max(state.lengthM, state.widthM, 6);
  const unit = 125 / maxPlan;
  const L = state.lengthM * unit;
  const W = state.widthM * unit;
  const H = Math.max(32, Math.min(95, state.storeyHeightM * 28));
  const eaves = Math.max(4, state.eavesM * unit);

  const roof = roofGeometry(state.roofType, L, W, H, state.pitchDeg, eaves);

  // Narożniki bryły
  const g000 = iso(0, 0, 0);
  const gL00 = iso(L, 0, 0);
  const gLW0 = iso(L, W, 0);
  const g0W0 = iso(0, W, 0);
  const g00H = iso(0, 0, H);
  const gL0H = iso(L, 0, H);
  const gLWH = iso(L, W, H);
  const g0WH = iso(0, W, H);

  const faces = roof.faces.map((f) => ({
    ...f,
    screen: f.pts.map(([x, y, z]) => iso(x, y, z)),
  }));

  // Sortuj ściany dachu od tyłu (większe y ekranu / dalej)
  const sortedFaces = [...faces].sort((a, b) => {
    const ay = a.screen.reduce((s, p) => s + p.y, 0) / a.screen.length;
    const by = b.screen.reduce((s, p) => s + p.y, 0) / b.screen.length;
    return ay - by;
  });

  return (
    <svg
      viewBox="0 0 420 300"
      className="h-auto w-full"
      role="img"
      aria-label={`Widok 3D budynku — dach ${ROOF_TYPE_LABELS[state.roofType]}`}
    >
      <defs>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.15" />
        </linearGradient>
        <pattern id={`${uid}-tiles`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={cover.edge} strokeWidth="0.7" opacity="0.35" />
        </pattern>
      </defs>

      <rect width="420" height="300" fill="#eef2f6" />
      <ellipse
        cx={iso(L / 2, W / 2, 0).x}
        cy={iso(L / 2, W / 2, 0).y + 18}
        rx={Math.max(L, W) * 0.75}
        ry={28}
        fill="#0f766e"
        opacity={0.06}
      />

      {/* Płyta fundamentu / cień */}
      <polygon
        points={poly([
          iso(-10, -10, 0),
          iso(L + 10, -10, 0),
          iso(L + 10, W + 10, 0),
          iso(-10, W + 10, 0),
        ])}
        fill="#dbe3ea"
        stroke="#94a3b8"
        strokeWidth={1}
      />

      {/* Ściana boczna (długość widoczna z prawej) */}
      <polygon
        points={poly([gL00, gLW0, gLWH, gL0H])}
        fill={wallSide}
        stroke="#475569"
        strokeWidth={1.4}
      />
      {/* Ściana frontowa (szerokość) */}
      <polygon
        points={poly([g000, gL00, gL0H, g00H])}
        fill={wallFront}
        stroke="#475569"
        strokeWidth={1.4}
      />

      {/* Okna front */}
      <polygon
        points={poly([
          iso(L * 0.18, 0.5, H * 0.35),
          iso(L * 0.38, 0.5, H * 0.35),
          iso(L * 0.38, 0.5, H * 0.7),
          iso(L * 0.18, 0.5, H * 0.7),
        ])}
        fill="#7dd3fc"
        stroke="#0369a1"
        strokeWidth={0.8}
        opacity={0.9}
      />
      <polygon
        points={poly([
          iso(L * 0.62, 0.5, H * 0.35),
          iso(L * 0.82, 0.5, H * 0.35),
          iso(L * 0.82, 0.5, H * 0.7),
          iso(L * 0.62, 0.5, H * 0.7),
        ])}
        fill="#7dd3fc"
        stroke="#0369a1"
        strokeWidth={0.8}
        opacity={0.9}
      />

      {/* Drzwi */}
      <polygon
        points={poly([
          iso(L * 0.44, 0.5, 0),
          iso(L * 0.56, 0.5, 0),
          iso(L * 0.56, 0.5, H * 0.55),
          iso(L * 0.44, 0.5, H * 0.55),
        ])}
        fill="#78350f"
        stroke="#451a03"
        strokeWidth={0.8}
      />

      {/* Dach — powierzchnie */}
      {sortedFaces.map((face, i) => (
        <g key={i}>
          <polygon
            points={poly(face.screen)}
            fill={shadeColor(cover.a, face.shade)}
            stroke={cover.edge}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <polygon
            points={poly(face.screen)}
            fill={`url(#${uid}-tiles)`}
            opacity={0.45}
          />
        </g>
      ))}

      {/* Kalenica */}
      {roof.ridge ? (
        <line
          x1={iso(...roof.ridge[0]).x}
          y1={iso(...roof.ridge[0]).y}
          x2={iso(...roof.ridge[1]).x}
          y2={iso(...roof.ridge[1]).y}
          stroke={cover.edge}
          strokeWidth={2.2}
        />
      ) : null}

      {/* Izolacja — wewnętrzna warstwa pod dachem */}
      {showInsulation && state.insulationEnabled ? (
        <polygon
          points={poly(
            sortedFaces[0]?.screen.map((p) => ({
              x: p.x,
              y: p.y + 4 + state.insulationThicknessCm / 8,
            })) || []
          )}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 3"
          opacity={0.85}
        />
      ) : null}

      {/* Wymiary izometryczne */}
      <DimLineIso
        a={g000}
        b={gL00}
        label={`dł. ${fmt(state.lengthM)}`}
        offset={{ x: -14, y: 22 }}
        color="#0f766e"
      />
      <DimLineIso
        a={g000}
        b={g0W0}
        label={`szer. ${fmt(state.widthM)}`}
        offset={{ x: 18, y: 20 }}
        color="#0369a1"
      />
      {/* Wysokość ściany */}
      <g stroke="#c2410c" fill="none" strokeWidth={1.4}>
        <line
          x1={gL00.x + 16}
          y1={gL00.y}
          x2={gL0H.x + 16}
          y2={gL0H.y}
        />
        <line x1={gL00.x + 12} y1={gL00.y} x2={gL00.x + 20} y2={gL00.y} />
        <line x1={gL0H.x + 12} y1={gL0H.y} x2={gL0H.x + 20} y2={gL0H.y} />
        <DimLabel
          x={gL00.x + 38}
          y={(gL00.y + gL0H.y) / 2}
          text={`H ${fmt(state.storeyHeightM)}`}
          color="#c2410c"
        />
      </g>

      {/* Kąt na połaci */}
      {state.roofType !== "flat" ? (
        <DimLabel
          x={iso(L * 0.55, W * 0.15, H + roof.rise * 0.45).x}
          y={iso(L * 0.55, W * 0.15, H + roof.rise * 0.45).y - 8}
          text={`${state.pitchDeg}°`}
          color="#7c3aed"
        />
      ) : (
        <DimLabel
          x={iso(L / 2, W / 2, H + roof.rise).x}
          y={iso(L / 2, W / 2, H + roof.rise).y - 14}
          text="dach płaski"
          color="#7c3aed"
        />
      )}

      {/* Mini rzut z góry — wyraźnie długość × szerokość */}
      {(() => {
        const fx = 18;
        const fy = 200;
        const maxF = Math.max(state.lengthM, state.widthM, 1);
        const fs = 70 / maxF;
        const fL = state.lengthM * fs;
        const fW = state.widthM * fs;
        return (
          <g>
            <rect
              x={fx - 8}
              y={fy - 18}
              width={fL + 56}
              height={fW + 48}
              rx={8}
              fill="white"
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <text x={fx} y={fy - 6} fontSize={9} fontWeight={700} fill="#334155">
              Rzut z góry
            </text>
            <rect
              x={fx}
              y={fy}
              width={fL}
              height={fW}
              fill="#ccfbf1"
              stroke="#0f766e"
              strokeWidth={1.5}
            />
            <text
              x={fx + fL / 2}
              y={fy + fW + 12}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="#0f766e"
            >
              dł. {fmt(state.lengthM)}
            </text>
            <text
              x={fx + fL + 6}
              y={fy + fW / 2 + 3}
              fontSize={9}
              fontWeight={700}
              fill="#0369a1"
            >
              szer. {fmt(state.widthM)}
            </text>
          </g>
        );
      })()}

      <g fontSize={9} fill="#64748b">
        <text x={16} y={22}>Widok 3D · widać typ dachu</text>
      </g>
    </svg>
  );
}

function SectionView({
  state,
  showInsulation,
  uid,
}: {
  state: WizardState;
  showInsulation: boolean;
  uid: string;
}) {
  const cover = COVER[state.covering];
  const pitch = Math.min(Math.max(state.pitchDeg, state.roofType === "flat" ? 0 : 5), 55);

  // Przekrój poprzeczny (wzdłuż szerokości) — najlepiej widać typ dachu i kąt
  const ox = 50;
  const ground = 210;
  const scaleW = 260 / Math.max(state.widthM, 4);
  const wallH = Math.max(50, Math.min(110, state.storeyHeightM * 32));
  const W = state.widthM * scaleW;
  const eaves = Math.min(state.eavesM * scaleW, 28);
  const rise =
    state.roofType === "flat"
      ? 4
      : (W / 2) * Math.tan((pitch * Math.PI) / 180);

  const left = ox;
  const right = ox + W;
  const top = ground - wallH;
  const mid = (left + right) / 2;

  let roofPts: Pt[] = [];
  if (state.roofType === "flat") {
    roofPts = [
      { x: left - eaves, y: top - rise },
      { x: right + eaves, y: top - rise },
      { x: right + eaves, y: top },
      { x: left - eaves, y: top },
    ];
  } else if (state.roofType === "monopitch") {
    roofPts = [
      { x: left - eaves, y: top },
      { x: right + eaves, y: top - rise },
      { x: right, y: top },
      { x: left, y: top },
    ];
  } else if (state.roofType === "hip") {
    // W przekroju poprzecznym hip wygląda jak dwuspadowy (kalenica w środku)
    roofPts = [
      { x: left - eaves, y: top },
      { x: mid, y: top - rise },
      { x: right + eaves, y: top },
    ];
  } else {
    // gabled
    roofPts = [
      { x: left - eaves, y: top },
      { x: mid, y: top - rise },
      { x: right + eaves, y: top },
    ];
  }

  const roofPath = `M ${roofPts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;

  return (
    <svg
      viewBox="0 0 360 260"
      className="h-auto w-full"
      role="img"
      aria-label="Przekrój boczny budynku"
    >
      <defs>
        <pattern id={`${uid}-sec-tiles`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0" stroke={cover.edge} strokeWidth="0.6" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="360" height="260" fill="#f8fafc" />
      <line x1={20} y1={ground} x2={340} y2={ground} stroke="#cbd5e1" strokeWidth={2} />

      {/* Ściany przekroju */}
      <rect
        x={left}
        y={top}
        width={W}
        height={wallH}
        fill="#f1f5f9"
        stroke="#64748b"
        strokeWidth={1.5}
      />
      {/* Podłoga / strop */}
      <line
        x1={left}
        y1={top + wallH * 0.5}
        x2={right}
        y2={top + wallH * 0.5}
        stroke="#94a3b8"
        strokeDasharray="4 3"
        strokeWidth={1}
      />

      {/* Dach */}
      <path d={roofPath} fill={cover.a} stroke={cover.edge} strokeWidth={1.6} />
      <path d={roofPath} fill={`url(#${uid}-sec-tiles)`} opacity={0.45} />

      {showInsulation && state.insulationEnabled && state.roofType !== "flat" ? (
        <path
          d={
            state.roofType === "monopitch"
              ? `M ${left + 6} ${top + 8} L ${right - 6} ${top - rise + 14}`
              : `M ${left + 8} ${top + 6} L ${mid} ${top - rise + 12} L ${right - 8} ${top + 6}`
          }
          fill="none"
          stroke="#f59e0b"
          strokeWidth={3 + state.insulationThicknessCm / 10}
          strokeLinecap="round"
          opacity={0.75}
        />
      ) : null}

      {/* Wymiar szerokości */}
      <g stroke="#0369a1" fill="none" strokeWidth={1.4}>
        <line x1={left} y1={ground + 18} x2={right} y2={ground + 18} />
        <line x1={left} y1={ground + 14} x2={left} y2={ground + 22} />
        <line x1={right} y1={ground + 14} x2={right} y2={ground + 22} />
        <DimLabel
          x={mid}
          y={ground + 32}
          text={`szerokość ${fmt(state.widthM)}`}
          color="#0369a1"
        />
      </g>

      {/* Wymiar wysokości */}
      <g stroke="#c2410c" fill="none" strokeWidth={1.4}>
        <line x1={right + 22} y1={top} x2={right + 22} y2={ground} />
        <line x1={right + 18} y1={top} x2={right + 26} y2={top} />
        <line x1={right + 18} y1={ground} x2={right + 26} y2={ground} />
        <DimLabel
          x={right + 48}
          y={(top + ground) / 2}
          text={`H ${fmt(state.storeyHeightM)}`}
          color="#c2410c"
        />
      </g>

      {/* Kąt nachylenia */}
      {state.roofType !== "flat" ? (
        <g>
          <path
            d={
              state.roofType === "monopitch"
                ? `M ${right - 40} ${top} L ${right - 10} ${top} L ${right - 10} ${top - rise * 0.35}`
                : `M ${mid + 8} ${top - rise + 4} L ${mid + 36} ${top - rise + 4} A 28 28 0 0 1 ${mid + 28} ${top - rise + 28}`
            }
            fill="none"
            stroke="#7c3aed"
            strokeWidth={1.3}
          />
          <DimLabel
            x={
              state.roofType === "monopitch"
                ? right - 8
                : mid + 48
            }
            y={
              state.roofType === "monopitch"
                ? top - rise * 0.5
                : top - rise + 18
            }
            text={`${state.pitchDeg}°`}
            color="#7c3aed"
          />
        </g>
      ) : null}

      {/* Długość — osobna belka (głębia poza przekrojem) */}
      <g>
        <rect
          x={16}
          y={16}
          width={200}
          height={36}
          rx={8}
          fill="white"
          stroke="#0f766e"
          strokeWidth={1}
        />
        <text x={28} y={32} fontSize={11} fontWeight={700} fill="#0f766e">
          Przekrój poprzeczny
        </text>
        <text x={28} y={46} fontSize={10} fill="#64748b">
          długość budynku (w głąb): {fmt(state.lengthM)}
        </text>
      </g>

      {/* Etykieta typu dachu */}
      <text
        x={mid}
        y={Math.min(...roofPts.map((p) => p.y)) - 12}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#0f172a"
      >
        {ROOF_TYPE_LABELS[state.roofType]}
      </text>

      {state.roofType === "hip" ? (
        <text
          x={mid}
          y={ground + 48}
          textAnchor="middle"
          fontSize={9}
          fill="#64748b"
        >
          W przekroju kalenica wygląda jak dwuspadowy — 4 połacie widać w widoku 3D
        </text>
      ) : null}
    </svg>
  );
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
  const [view, setView] = useState<ViewMode>("iso");
  const uid = useId().replace(/:/g, "");
  const cover = COVER[state.covering];

  const hint = useMemo(() => {
    switch (state.roofType) {
      case "gabled":
        return "Dwie połacie + kalenica wzdłuż budynku";
      case "hip":
        return "Cztery połacie — widać trójkątne boki";
      case "monopitch":
        return "Jedna połać ze spadkiem w jedną stronę";
      case "flat":
        return "Prawie pozioma powierzchnia dachu";
    }
  }, [state.roofType]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--rf-border)] bg-white",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--rf-border)] px-3 py-2.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-accent)]">
            Podgląd budynku
          </p>
          <p className="text-sm font-semibold text-[var(--rf-ink)]">
            {ROOF_TYPE_LABELS[state.roofType]}
          </p>
          <p className="text-xs text-[var(--rf-muted)]">{hint}</p>
        </div>
        <div className="flex rounded-lg border border-[var(--rf-border)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("iso")}
            className={cn(
              "rounded-md px-2.5 py-1.5 transition",
              view === "iso"
                ? "bg-[var(--rf-ink)] text-white"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setView("section")}
            className={cn(
              "rounded-md px-2.5 py-1.5 transition",
              view === "section"
                ? "bg-[var(--rf-ink)] text-white"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Przekrój
          </button>
        </div>
      </div>

      <div className="bg-[#f1f5f9]">
        {view === "iso" ? (
          <IsometricBuilding
            state={state}
            showFacade={showFacade}
            showInsulation={showInsulation}
            uid={uid}
          />
        ) : (
          <SectionView
            state={state}
            showInsulation={showInsulation}
            uid={uid}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[var(--rf-border)] px-3 py-3 text-[11px] sm:grid-cols-4">
        <Metric label="Długość" value={fmt(state.lengthM)} tone="teal" />
        <Metric label="Szerokość" value={fmt(state.widthM)} tone="blue" />
        <Metric label="Wysokość" value={fmt(state.storeyHeightM)} tone="orange" />
        <Metric
          label={state.roofType === "flat" ? "Dach" : "Kąt"}
          value={state.roofType === "flat" ? "płaski" : `${state.pitchDeg}°`}
          tone="violet"
        />
      </div>
      <p className="border-t border-[var(--rf-border)] px-3 py-2 text-[11px] text-[var(--rf-muted)]">
        {view === "iso"
          ? `Pokrycie: ${cover.label}. Wymiary długości i szerokości są narysowane wzdłuż krawędzi budynku.`
          : `Przekrój wzdłuż szerokości — widać kąt dachu i wysokość ścian. Długość budynku (${fmt(state.lengthM)}) idzie „w głąb” poza przekrój.`}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "teal" | "blue" | "orange" | "violet";
}) {
  const colors = {
    teal: "text-[#0f766e]",
    blue: "text-[#0369a1]",
    orange: "text-[#c2410c]",
    violet: "text-[#7c3aed]",
  };
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
      <p className="text-slate-500">{label}</p>
      <p className={cn("font-semibold", colors[tone])}>{value}</p>
    </div>
  );
}
