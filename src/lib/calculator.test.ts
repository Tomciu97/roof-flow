import {
  calcFacadeGrossArea,
  calcFacadeNetArea,
  calcInsulationArea,
  calcProjectionArea,
  calcRoofArea,
  calcRoofAreaWithWaste,
  calculateQuote,
  resolveB2CAmount,
} from "./calculator";
import { DEFAULT_PRICING_RATES } from "./constants";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, eps = 0.1) {
  assert(Math.abs(a - b) < eps, `Oczekiwano ~${b}, otrzymano ${a}`);
}

const geometry = {
  lengthM: 12,
  widthM: 8,
  roofType: "gabled" as const,
  pitchDeg: 30,
  eavesM: 0.5,
};

assert(calcProjectionArea(12, 8) === 96, "rzut");
approx(calcRoofArea(geometry), (13 * 9) / Math.cos((30 * Math.PI) / 180));
approx(calcRoofAreaWithWaste(geometry), calcRoofArea(geometry) * 1.05);
approx(calcInsulationArea(100), 115);
assert(calcFacadeGrossArea(12, 8, 2.8) === 2 * (12 + 8) * 2.8, "elewacja brutto");
approx(calcFacadeNetArea(100), 85);

const quote = calculateQuote(
  geometry,
  { standard: "standard", gutters: true, roofWindows: 2 },
  { enabled: true, material: "wool", thicknessCm: 20 },
  { enabled: true, material: "styrofoam", storeyHeightM: 2.8 },
  DEFAULT_PRICING_RATES
);

assert(quote.priceMin < quote.baseTotal, "min < baza");
assert(quote.priceMax > quote.baseTotal, "max > baza");
assert(quote.insulationAreaM2 > 0, "izolacja > 0");
assert(quote.facadeNetAreaM2 > 0, "elewacja > 0");

assert(resolveB2CAmount(false, false) === 59, "59");
assert(resolveB2CAmount(true, false) === 78, "78");
assert(resolveB2CAmount(false, true) === 78, "78b");
assert(resolveB2CAmount(true, true) === 87, "87");

console.log("OK — wszystkie asercje kalkulatora przeszły.");
