import { DEFAULT_PRICING_RATES, WASTE_MULTIPLIERS } from "./constants";
import type {
  CalculationBreakdown,
  CoveringInput,
  FacadeInput,
  InsulationInput,
  PricingRates,
  RoofGeometryInput,
  WizardState,
} from "./types";

/** Powierzchnia rzutu = Długość × Szerokość */
export function calcProjectionArea(lengthM: number, widthM: number): number {
  return lengthM * widthM;
}

/**
 * Powierzchnia połaci =
 * ((Długość + 2×Okap) × (Szerokość + 2×Okap)) / cos(Kąt)
 */
export function calcRoofArea(input: RoofGeometryInput): number {
  const { lengthM, widthM, pitchDeg, eavesM, roofType } = input;

  if (roofType === "flat") {
    return (lengthM + 2 * eavesM) * (widthM + 2 * eavesM);
  }

  const angleRad = (Math.min(Math.max(pitchDeg, 0), 60) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  if (cos <= 0.01) {
    throw new Error("Kąt nachylenia jest zbyt duży do poprawnego wyliczenia.");
  }

  return ((lengthM + 2 * eavesM) * (widthM + 2 * eavesM)) / cos;
}

export function calcRoofAreaWithWaste(input: RoofGeometryInput): number {
  const area = calcRoofArea(input);
  return area * WASTE_MULTIPLIERS[input.roofType];
}

/** Powierzchnia izolacji poddasza = Powierzchnia połaci × 1.15 */
export function calcInsulationArea(roofAreaM2: number): number {
  return roofAreaM2 * 1.15;
}

/** Obwód = 2 × (Długość + Szerokość) */
export function calcPerimeter(lengthM: number, widthM: number): number {
  return 2 * (lengthM + widthM);
}

/** Powierzchnia ścian brutto = Obwód × Wysokość kondygnacji */
export function calcFacadeGrossArea(
  lengthM: number,
  widthM: number,
  storeyHeightM: number
): number {
  return calcPerimeter(lengthM, widthM) * storeyHeightM;
}

/** Powierzchnia elewacji netto = Brutto × 0.85 (odliczenie 15% na otwory) */
export function calcFacadeNetArea(grossAreaM2: number): number {
  return grossAreaM2 * 0.85;
}

function timberVolumeFromRoof(roofAreaWithWasteM2: number): number {
  // Uproszczony model: ~0.035 m³ drewna więźby na 1 m² połaci
  return roofAreaWithWasteM2 * 0.035;
}

export function calculateQuote(
  geometry: RoofGeometryInput,
  covering: CoveringInput,
  insulation: InsulationInput,
  facade: FacadeInput,
  rates: PricingRates = DEFAULT_PRICING_RATES
): CalculationBreakdown {
  const projectionAreaM2 = calcProjectionArea(geometry.lengthM, geometry.widthM);
  const roofAreaM2 = calcRoofArea(geometry);
  const roofAreaWithWasteM2 = calcRoofAreaWithWaste(geometry);

  const insulationAreaM2 = insulation.enabled
    ? calcInsulationArea(roofAreaWithWasteM2)
    : 0;

  const facadeGrossAreaM2 = facade.enabled
    ? calcFacadeGrossArea(
        geometry.lengthM,
        geometry.widthM,
        facade.storeyHeightM
      )
    : 0;
  const facadeNetAreaM2 = facade.enabled
    ? calcFacadeNetArea(facadeGrossAreaM2)
    : 0;

  const coveringCost =
    roofAreaWithWasteM2 * rates.tileRates[covering.standard];

  const timberCost =
    timberVolumeFromRoof(roofAreaWithWasteM2) * rates.timberRate;

  const thicknessFactor = insulation.enabled
    ? Math.max(insulation.thicknessCm, 10) / 20
    : 1;

  const insulationCost = insulation.enabled
    ? insulationAreaM2 *
      (rates.insulationRates[insulation.material] * thicknessFactor +
        rates.gkFinishRate)
    : 0;

  const facadeCost = facade.enabled
    ? facadeNetAreaM2 *
      (rates.facadeRates[facade.material] +
        rates.plasterRate +
        rates.scaffoldingRate)
    : 0;

  const perimeter = calcPerimeter(geometry.lengthM, geometry.widthM);
  const extrasCost =
    (covering.gutters ? perimeter * rates.gutterRatePerM : 0) +
    covering.roofWindows * rates.roofWindowRate;

  const laborBaseArea =
    roofAreaWithWasteM2 +
    (insulation.enabled ? insulationAreaM2 * 0.4 : 0) +
    (facade.enabled ? facadeNetAreaM2 * 0.5 : 0);

  const laborCost = laborBaseArea * rates.baseLaborRate;

  const baseTotal =
    coveringCost + timberCost + insulationCost + facadeCost + laborCost + extrasCost;

  const buffer = Math.min(Math.max(rates.marginBuffer, 0), 0.25);
  const priceMin = baseTotal * (1 - buffer);
  const priceMax = baseTotal * (1 + buffer);

  return {
    projectionAreaM2: round2(projectionAreaM2),
    roofAreaM2: round2(roofAreaM2),
    roofAreaWithWasteM2: round2(roofAreaWithWasteM2),
    insulationAreaM2: round2(insulationAreaM2),
    facadeGrossAreaM2: round2(facadeGrossAreaM2),
    facadeNetAreaM2: round2(facadeNetAreaM2),
    coveringCost: round2(coveringCost),
    timberCost: round2(timberCost),
    insulationCost: round2(insulationCost),
    facadeCost: round2(facadeCost),
    laborCost: round2(laborCost),
    extrasCost: round2(extrasCost),
    baseTotal: round2(baseTotal),
    priceMin: round2(priceMin),
    priceMax: round2(priceMax),
  };
}

export function calculateFromWizard(
  state: WizardState,
  rates: PricingRates = DEFAULT_PRICING_RATES
): CalculationBreakdown {
  return calculateQuote(
    {
      lengthM: state.lengthM,
      widthM: state.widthM,
      roofType: state.roofType,
      pitchDeg: state.pitchDeg,
      eavesM: state.eavesM,
    },
    {
      standard: state.covering,
      gutters: state.gutters,
      roofWindows: state.roofWindows,
    },
    {
      enabled: state.insulationEnabled,
      material: state.insulationMaterial,
      thicknessCm: state.insulationThicknessCm,
    },
    {
      enabled: state.facadeEnabled,
      material: state.facadeMaterial,
      storeyHeightM: state.storeyHeightM,
    },
    rates
  );
}

export function resolveB2CAmount(
  insulationEnabled: boolean,
  facadeEnabled: boolean
): number {
  if (insulationEnabled && facadeEnabled) return 87;
  if (insulationEnabled || facadeEnabled) return 78;
  return 59;
}

export function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatM2(area: number): string {
  return `${new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1,
  }).format(area)} m²`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
